package com.coachdesk.fee;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class FeeDtos {

    private FeeDtos() {
    }

    public enum Status { PAID, PARTIAL, UNPAID, NO_FEE }

    public record FeeRow(Long studentId, String studentName, Long batchId, String batchName,
                         String parentPhone, BigDecimal fee, BigDecimal paid, BigDecimal due, Status status) {
    }

    public record MonthSummary(String month, BigDecimal expected, BigDecimal collected,
                               BigDecimal pending, List<FeeRow> rows) {
    }

    public record PaymentRequest(
            @NotNull(message = "Student is required") Long studentId,
            @NotBlank(message = "Month is required")
            @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])", message = "Month must look like 2026-09") String month,
            @NotNull(message = "Amount is required")
            @DecimalMin(value = "0.01", message = "Amount must be more than 0")
            @Digits(integer = 8, fraction = 2) BigDecimal amount,
            LocalDate paidOn,
            @NotNull(message = "Payment mode is required") FeePayment.Mode mode,
            @Size(max = 255) String note) {
    }

    public record PaymentResponse(Long id, Long studentId, String month, BigDecimal amount,
                                  LocalDate paidOn, FeePayment.Mode mode, String note) {
        static PaymentResponse from(FeePayment p) {
            return new PaymentResponse(p.getId(), p.getStudentId(), p.getFeeMonth(), p.getAmount(),
                    p.getPaidOn(), p.getMode(), p.getNote());
        }
    }
}
