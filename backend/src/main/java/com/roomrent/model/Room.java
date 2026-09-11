package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Document(collection = "rooms")
@Getter
@Setter
public class Room {

    @Id
    private Long id;

    private Long propertyId;

    private String roomNumber;

    private String floor;

    private BigDecimal monthlyRent = BigDecimal.ZERO;

    // Room-level electricity rate (rupees per unit). Falls back to property/default if null.
    private BigDecimal electricityRate;

    private String electricityBillingMethod = "SUB_METER";

    private RoomStatus status = RoomStatus.VACANT;

    // Convenience denormalized pointer to the currently-assigned tenant
    private Long currentTenantId;

    private Instant createdAt = Instant.now();
}
