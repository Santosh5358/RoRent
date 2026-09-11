package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Historical record of a tenant occupying a room. Preserved even after move-out.
 */
@Document(collection = "room_assignments")
@Getter
@Setter
public class RoomAssignment {

    @Id
    private Long id;

    private Long roomId;

    private Long tenantId;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal monthlyRent = BigDecimal.ZERO;

    private Instant createdAt = Instant.now();
}
