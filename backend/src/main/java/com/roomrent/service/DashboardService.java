package com.roomrent.service;

import com.roomrent.dto.DashboardResponse;
import com.roomrent.model.*;
import com.roomrent.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final MeterReadingRepository readingRepository;
    private final TenantRepository tenantRepository;
    private final BillService billService;

    public DashboardService(PropertyRepository propertyRepository,
                            RoomRepository roomRepository,
                            BillRepository billRepository,
                            PaymentRepository paymentRepository,
                            MeterReadingRepository readingRepository,
                            TenantRepository tenantRepository,
                            BillService billService) {
        this.propertyRepository = propertyRepository;
        this.roomRepository = roomRepository;
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.readingRepository = readingRepository;
        this.tenantRepository = tenantRepository;
        this.billService = billService;
    }

    public DashboardResponse build(Long ownerId) {
        List<Property> properties = propertyRepository.findByOwnerIdOrderByNameAsc(ownerId);
        List<Long> propertyIds = properties.stream().map(Property::getId).toList();

        List<Room> rooms = propertyIds.isEmpty() ? List.of()
                : roomRepository.findByPropertyIdIn(propertyIds);
        long occupied = rooms.stream().filter(r -> r.getStatus() == RoomStatus.OCCUPIED).count();
        long vacant = rooms.stream().filter(r -> r.getStatus() == RoomStatus.VACANT).count();
        long maintenance = rooms.stream().filter(r -> r.getStatus() == RoomStatus.MAINTENANCE).count();

        LocalDate month = LocalDate.now().withDayOfMonth(1);
        List<Bill> monthBills = billRepository.findByOwnerIdAndBillingMonth(ownerId, month);
        BigDecimal rentThisMonth = sum(monthBills, Bill::getRentAmount);
        BigDecimal electricityThisMonth = sum(monthBills, Bill::getElectricityAmount);
        BigDecimal totalBilledThisMonth = sum(monthBills, Bill::getTotalAmount);

        List<Bill> allBills = billRepository.findByOwnerIdOrderByBillingMonthDescIdDesc(ownerId);
        BigDecimal totalCollected = sum(allBills, Bill::getAmountPaid);
        BigDecimal totalPending = allBills.stream()
                .map(billService::outstanding)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Refresh overdue status on the fly
        List<Bill> overdue = new ArrayList<>();
        for (Bill b : allBills) {
            billService.recomputeStatus(b);
            if (b.getStatus() == BillStatus.OVERDUE) overdue.add(b);
        }

        List<Payment> recentPayments = capped(
                paymentRepository.findByOwnerIdOrderByPaymentDateDescIdDesc(ownerId), 5);
        List<MeterReading> recentReadings = capped(
                readingRepository.findByRoomIdInOrderByReadingDateDescIdDesc(
                        rooms.stream().map(Room::getId).toList()), 5);
        List<Bill> recentBills = capped(allBills, 5);

        List<String> notifications = buildNotifications(rooms, allBills, overdue, month);

        return new DashboardResponse(
                properties.size(), rooms.size(), occupied, vacant, maintenance,
                rentThisMonth, electricityThisMonth, totalBilledThisMonth,
                totalCollected, totalPending,
                recentPayments, recentReadings, recentBills, capped(overdue, 10),
                notifications);
    }

    private List<String> buildNotifications(List<Room> rooms, List<Bill> allBills,
                                            List<Bill> overdue, LocalDate month) {
        List<String> notes = new ArrayList<>();
        for (Bill b : overdue) {
            notes.add("Overdue bill for room #" + b.getRoomId()
                    + " (due " + b.getDueDate() + ")");
        }
        // Occupied rooms missing a reading this month
        for (Room room : rooms) {
            if (room.getStatus() != RoomStatus.OCCUPIED) continue;
            boolean hasReadingThisMonth = readingRepository
                    .findByRoomIdOrderByReadingDateDescIdDesc(room.getId()).stream()
                    .anyMatch(r -> !r.getReadingDate().isBefore(month));
            if (!hasReadingThisMonth) {
                notes.add("Missing meter reading this month for room " + room.getRoomNumber());
            }
        }
        return notes;
    }

    private static <T> BigDecimal sum(List<T> items, java.util.function.Function<T, BigDecimal> f) {
        return items.stream()
                .map(f)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static <T> List<T> capped(List<T> list, int n) {
        return list.stream().limit(n).toList();
    }
}
