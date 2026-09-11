package com.roomrent.dto;

import com.roomrent.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull Long billId,
        @NotNull @Positive BigDecimal amount,
        LocalDate paymentDate,
        @NotNull PaymentMethod paymentMethod,
        String transactionReference,
        String notes) {
}
