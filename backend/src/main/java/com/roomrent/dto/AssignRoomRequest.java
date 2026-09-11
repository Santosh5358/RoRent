package com.roomrent.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssignRoomRequest(
        @NotNull Long roomId,
        @NotNull LocalDate startDate,
        BigDecimal monthlyRent) {
}
