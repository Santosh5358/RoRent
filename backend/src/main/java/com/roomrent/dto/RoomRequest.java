package com.roomrent.dto;

import com.roomrent.model.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RoomRequest(
        @NotNull Long propertyId,
        @NotBlank String roomNumber,
        String floor,
        @NotNull BigDecimal monthlyRent,
        BigDecimal electricityRate,
        String electricityBillingMethod,
        RoomStatus status) {
}
