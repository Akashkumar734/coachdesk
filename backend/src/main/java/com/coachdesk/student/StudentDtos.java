package com.coachdesk.student;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class StudentDtos {

    private StudentDtos() {
    }

    public record StudentRequest(
            @NotBlank(message = "Student name is required") @Size(max = 100) String name,
            @Size(max = 20) String phone,
            @Size(max = 100) String parentName,
            @Size(max = 20) String parentPhone,
            Long batchId,
            LocalDate joinDate,
            @DecimalMin(value = "0", message = "Fee cannot be negative")
            @Digits(integer = 8, fraction = 2) BigDecimal monthlyFee,
            Boolean active,
            @Size(max = 2000) String notes) {
    }

    public record StudentResponse(
            Long id, String name, String phone, String parentName, String parentPhone,
            Long batchId, String batchName, LocalDate joinDate,
            BigDecimal monthlyFee,        // personal fee, may be null
            BigDecimal effectiveFee,      // what is actually charged per month
            boolean active, String notes) {
    }
}
