package com.coachdesk.common;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

/** Helper for "YYYY-MM" month strings used by fees and attendance. */
public final class Months {

    private Months() {
    }

    public static YearMonth parseOrCurrent(String value) {
        if (value == null || value.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(value.trim());
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Month must look like 2026-09");
        }
    }
}
