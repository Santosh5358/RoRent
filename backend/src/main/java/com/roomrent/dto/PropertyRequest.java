package com.roomrent.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record PropertyRequest(
        @NotBlank String name,
        String address,
        BigDecimal defaultElectricityRate) {
}
