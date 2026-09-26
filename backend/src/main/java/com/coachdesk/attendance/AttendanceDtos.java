package com.coachdesk.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public final class AttendanceDtos {

    private AttendanceDtos() {
    }

    /** One row on the "mark attendance" screen. present = null means not marked yet. */
    public record AttendanceRow(Long studentId, String studentName, Boolean present) {
    }

    public record DayAttendance(Long batchId, LocalDate date, List<AttendanceRow> rows) {
    }

    public record Entry(@NotNull Long studentId, @NotNull Boolean present) {
    }

    public record MarkRequest(
            @NotNull(message = "Date is required") LocalDate date,
            @NotEmpty(message = "Add at least one student") List<@Valid Entry> entries) {
    }

    public record StudentDay(LocalDate date, boolean present) {
    }

    public record StudentMonth(Long studentId, String month, int presentDays, int absentDays,
                               int percentage, List<StudentDay> days) {
    }
}
