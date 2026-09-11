package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "meter_readings")
@Getter
@Setter
public class MeterReading {

    @Id
    private Long id;

    private Long roomId;

    private Long tenantId;

    private LocalDate readingDate;

    private BigDecimal previousReading = BigDecimal.ZERO;

    private BigDecimal currentReading = BigDecimal.ZERO;

    private BigDecimal unitsConsumed = BigDecimal.ZERO;

    private BigDecimal pricePerUnit = BigDecimal.ZERO;

    private BigDecimal electricityAmount = BigDecimal.ZERO;

    private String imageUrl;

    private ReadingSource readingSource = ReadingSource.MANUAL;

    // OCR audit trail
    private String ocrDetectedReading;

    // Marks that the meter was reset/replaced at this reading (units = current only)
    private boolean meterReset = false;

    private Long createdBy;

    private Instant createdAt = Instant.now();
}
