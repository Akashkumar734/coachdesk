package com.coachdesk.fee;

import com.coachdesk.auth.CurrentTeacher;
import com.coachdesk.common.Months;
import com.coachdesk.fee.FeeDtos.MonthSummary;
import com.coachdesk.fee.FeeDtos.PaymentRequest;
import com.coachdesk.fee.FeeDtos.PaymentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final FeeService service;
    private final CurrentTeacher current;

    public FeeController(FeeService service, CurrentTeacher current) {
        this.service = service;
        this.current = current;
    }

    /** GET /api/fees?month=2026-09&batchId=1 */
    @GetMapping
    public MonthSummary month(@RequestParam(required = false) String month,
                              @RequestParam(required = false) Long batchId) {
        return service.monthSummary(current.id(), Months.parseOrCurrent(month), batchId);
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse record(@Valid @RequestBody PaymentRequest request) {
        return service.record(current.id(), request);
    }

    @GetMapping("/payments")
    public List<PaymentResponse> history(@RequestParam Long studentId) {
        return service.history(current.id(), studentId);
    }

    @DeleteMapping("/payments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(current.id(), id);
    }
}
