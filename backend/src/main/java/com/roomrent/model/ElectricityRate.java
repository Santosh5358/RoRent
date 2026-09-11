package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Time-effective electricity price. A rate may be scoped to a room (roomId set)
 * or a whole property (roomId null, propertyId set). Historical bills snapshot
 * the applied rate so they never change when a new rate is added.
 */
@Document(collection = "electricity_rates")
@Getter
@Setter
public class ElectricityRate {

    @Id
    private Long id;

    private Long ownerId;

    private Long propertyId;

    private Long roomId;

    private BigDecimal pricePerUnit;

    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    private Instant createdAt = Instant.now();
}
