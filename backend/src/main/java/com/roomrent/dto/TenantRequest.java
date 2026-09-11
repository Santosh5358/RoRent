package com.roomrent.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TenantRequest(
        @NotBlank String name,
        String phone,
        String email,
        String address,
        String idDocumentNumber,
        LocalDate moveInDate,
        LocalDate moveOutDate,
        BigDecimal securityDeposit) {
}
