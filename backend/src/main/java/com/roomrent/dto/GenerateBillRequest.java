package com.roomrent.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GenerateBillRequest(
        @NotNull Long roomId,
        // First day of billing month, e.g. 2026-03-01
        @NotNull LocalDate billingMonth,
        // Optional: use a specific meter reading; otherwise latest is used
        Long meterReadingId,
        BigDecimal otherCharges,
        BigDecimal discount,
        LocalDate dueDate,
        // Allow regenerating an existing bill for the same tenant/room/month
        boolean regenerate) {
}
