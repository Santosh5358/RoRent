package com.roomrent.dto;

import com.roomrent.model.Bill;
import com.roomrent.model.MeterReading;
import com.roomrent.model.Payment;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        long totalProperties,
        long totalRooms,
        long occupiedRooms,
        long vacantRooms,
        long maintenanceRooms,
        BigDecimal rentThisMonth,
        BigDecimal electricityThisMonth,
        BigDecimal totalBilledThisMonth,
        BigDecimal totalCollected,
        BigDecimal totalPending,
        List<Payment> recentPayments,
        List<MeterReading> recentReadings,
        List<Bill> recentBills,
        List<Bill> overdueBills,
        List<String> notifications) {
}
