package com.roomrent.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ElectricityRateRequest(
        Long propertyId,
        Long roomId,
        @NotNull BigDecimal pricePerUnit,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo) {
}
