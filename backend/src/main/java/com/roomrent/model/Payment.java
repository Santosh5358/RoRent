package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "payments")
@Getter
@Setter
public class Payment {

    @Id
    private Long id;

    private Long ownerId;

    private Long billId;

    private Long tenantId;

    private BigDecimal amount = BigDecimal.ZERO;

    private LocalDate paymentDate = LocalDate.now();

    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private String transactionReference;

    private String notes;

    private Instant createdAt = Instant.now();
}
