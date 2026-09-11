package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "bills")
@CompoundIndex(name = "uk_bill_tenant_room_month", def = "{'tenantId': 1, 'roomId': 1, 'billingMonth': 1}", unique = true)
@Getter
@Setter
public class Bill {

    @Id
    private Long id;

    private Long ownerId;

    private Long tenantId;

    private Long roomId;

    // Billing month stored as first day of the month, e.g. 2026-03-01
    private LocalDate billingMonth;

    private BigDecimal rentAmount = BigDecimal.ZERO;

    // Snapshot of meter figures at bill generation time (immutable history)
    private BigDecimal previousReading;

    private BigDecimal currentReading;

    private BigDecimal unitsConsumed;

    private BigDecimal pricePerUnit;

    private BigDecimal electricityAmount = BigDecimal.ZERO;

    private BigDecimal otherCharges = BigDecimal.ZERO;

    private BigDecimal discount = BigDecimal.ZERO;

    private BigDecimal totalAmount = BigDecimal.ZERO;

    private BigDecimal amountPaid = BigDecimal.ZERO;

    private LocalDate dueDate;

    private BillStatus status = BillStatus.UNPAID;

    private Long meterReadingId;

    private Instant createdAt = Instant.now();
}
