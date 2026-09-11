package com.roomrent.dto;

import java.math.BigDecimal;

/**
 * Read-only profile shown to a logged-in tenant in the portal.
 */
public record TenantProfileResponse(
        Long tenantId,
        String name,
        String phone,
        String email,
        String propertyName,
        String roomNumber,
        String floor,
        BigDecimal monthlyRent,
        BigDecimal currentElectricityRate,
        BigDecimal totalOutstanding,
        long totalBills,
        long unpaidBills) {
}
