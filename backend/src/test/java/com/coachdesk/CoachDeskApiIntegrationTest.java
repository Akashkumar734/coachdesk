package com.coachdesk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full flow against a real Postgres started by Testcontainers (needs Docker running).
 * Run with: mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class CoachDeskApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void fullTeacherFlow() throws Exception {
        // 1. Register
        String token = register("asha@example.com");

        // 2. Protected endpoints need a token
        mvc.perform(get("/api/batches")).andExpect(status().isUnauthorized());

        // 3. Create a batch with a monthly fee of 1000
        long batchId = body(mvc.perform(post("/api/batches").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Class 10 Maths","subject":"Maths","timing":"5-6 PM","monthlyFee":1000}
                                """))
                .andExpect(status().isCreated())
                .andReturn()).get("id").asLong();

        // 4. Add a student to the batch
        long studentId = body(mvc.perform(post("/api/students").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Rahul","parentPhone":"9876543210","batchId":%d}
                                """.formatted(batchId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.effectiveFee").value(1000))
                .andReturn()).get("id").asLong();

        // 5. Mark attendance for today
        String today = LocalDate.now().toString();
        mvc.perform(put("/api/attendance").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date":"%s","entries":[{"studentId":%d,"present":true}]}
                                """.formatted(today, studentId)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/attendance").param("batchId", String.valueOf(batchId)).param("date", today)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].present").value(true));

        // 6. Pay part of this month's fee -> PARTIAL, 400 due
        String month = YearMonth.now().toString();
        mvc.perform(post("/api/fees/payments").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"studentId":%d,"month":"%s","amount":600,"mode":"UPI"}
                                """.formatted(studentId, month)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/fees").param("month", month).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].status").value("PARTIAL"))
                .andExpect(jsonPath("$.pending").value(400));

        // 7. Dashboard adds it all up
        mvc.perform(get("/api/dashboard").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeStudents").value(1))
                .andExpect(jsonPath("$.feesCollected").value(600))
                .andExpect(jsonPath("$.todayPresent").value(1));
    }

    @Test
    void teachersCannotSeeEachOthersData() throws Exception {
        String a = register("teacher.a@example.com");
        String b = register("teacher.b@example.com");

        long batchId = body(mvc.perform(post("/api/batches").header("Authorization", bearer(a))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Private batch\",\"monthlyFee\":500}"))
                .andReturn()).get("id").asLong();

        mvc.perform(get("/api/attendance").param("batchId", String.valueOf(batchId))
                        .header("Authorization", bearer(b)))
                .andExpect(status().isNotFound());

        MvcResult list = mvc.perform(get("/api/batches").header("Authorization", bearer(b))).andReturn();
        assertThat(body(list).size()).isZero();
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        register("login.test@example.com");
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login.test@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Wrong email or password"));
    }

    private String register(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test Teacher","email":"%s","password":"secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(r).get("token").asText();
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
