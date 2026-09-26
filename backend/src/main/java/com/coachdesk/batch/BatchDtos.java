package com.coachdesk.batch;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class BatchDtos {

    private BatchDtos() {
    }

    public record BatchRequest(
            @NotBlank(message = "Batch name is required") @Size(max = 100) String name,
            @Size(max = 100) String subject,
            @Size(max = 100) String timing,
            @NotNull(message = "Monthly fee is required")
            @DecimalMin(value = "0", message = "Fee cannot be negative")
            @Digits(integer = 8, fraction = 2) BigDecimal monthlyFee,
            Boolean active) {
    }

    public record BatchResponse(Long id, String name, String subject, String timing,
                                BigDecimal monthlyFee, boolean active, long studentCount) {
    }
}
