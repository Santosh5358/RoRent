package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "properties")
@Getter
@Setter
public class Property {

    @Id
    private Long id;

    private Long ownerId;

    private String name;

    private String address;

    // Default electricity price for rooms in this property (rupees per unit)
    private java.math.BigDecimal defaultElectricityRate;

    private Instant createdAt = Instant.now();
}
