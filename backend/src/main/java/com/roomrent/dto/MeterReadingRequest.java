package com.roomrent.dto;

import com.roomrent.model.ReadingSource;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MeterReadingRequest(
        @NotNull Long roomId,
        @NotNull LocalDate readingDate,
        @NotNull BigDecimal currentReading,
        // If true, treat as meter reset/replacement (units = currentReading only)
        boolean meterReset,
        // Optional explicit rate override; otherwise resolved from room/property/rate history
        BigDecimal pricePerUnit,
        String imageUrl,
        ReadingSource readingSource,
        String ocrDetectedReading,
        // When true, the landlord confirmed a reading lower than previous
        boolean confirmLowerReading) {
}
