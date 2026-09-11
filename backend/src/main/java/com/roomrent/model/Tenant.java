package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "tenants")
@Getter
@Setter
public class Tenant {

    @Id
    private Long id;

    private Long ownerId;

    private String name;

    private String phone;
    private String email;
    private String address;
    private String idDocumentNumber;

    private LocalDate moveInDate;
    private LocalDate moveOutDate;

    private BigDecimal securityDeposit = BigDecimal.ZERO;

    // Denormalized current assignment for quick lookups
    private Long propertyId;

    private Long roomId;

    private BigDecimal monthlyRent = BigDecimal.ZERO;

    private TenantStatus status = TenantStatus.ACTIVE;

    private Instant createdAt = Instant.now();
}
