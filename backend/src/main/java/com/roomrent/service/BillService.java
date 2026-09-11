package com.roomrent.service;

import com.roomrent.dto.GenerateBillRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.*;
import com.roomrent.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;
    private final MeterReadingRepository readingRepository;

    public BillService(BillRepository billRepository,
                       RoomRepository roomRepository,
                       PropertyRepository propertyRepository,
                       TenantRepository tenantRepository,
                       MeterReadingRepository readingRepository) {
        this.billRepository = billRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
        this.tenantRepository = tenantRepository;
        this.readingRepository = readingRepository;
    }

    private Room ownedRoom(Long ownerId, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("Room not found"));
        Property property = propertyRepository.findById(room.getPropertyId())
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your room");
        }
        return room;
    }

    public List<Bill> list(Long ownerId) {
        return billRepository.findByOwnerIdOrderByBillingMonthDescIdDesc(ownerId);
    }

    public Bill get(Long ownerId, Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Bill not found"));
        if (!bill.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your bill");
        }
        return bill;
    }

    public List<Bill> listByRoom(Long ownerId, Long roomId) {
        ownedRoom(ownerId, roomId);
        return billRepository.findByRoomIdOrderByBillingMonthDescIdDesc(roomId);
    }

    @Transactional
    public Bill generate(Long ownerId, GenerateBillRequest req) {
        Room room = ownedRoom(ownerId, req.roomId());

        if (room.getStatus() != RoomStatus.OCCUPIED || room.getCurrentTenantId() == null) {
            throw ApiException.badRequest("Cannot generate a bill for a room without an active tenant");
        }
        Long tenantId = room.getCurrentTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> ApiException.notFound("Tenant not found"));

        // Normalize billing month to the first day
        LocalDate month = req.billingMonth().withDayOfMonth(1);

        Bill existing = billRepository
                .findByTenantIdAndRoomIdAndBillingMonth(tenantId, room.getId(), month)
                .orElse(null);
        if (existing != null && !req.regenerate()) {
            throw ApiException.conflict(
                    "A bill for this tenant, room and month already exists. Enable regenerate to overwrite.");
        }

        // Resolve the meter reading to bill from
        MeterReading reading = null;
        if (req.meterReadingId() != null) {
            reading = readingRepository.findById(req.meterReadingId())
                    .orElseThrow(() -> ApiException.notFound("Meter reading not found"));
            if (!reading.getRoomId().equals(room.getId())) {
                throw ApiException.badRequest("Meter reading does not belong to this room");
            }
        } else {
            reading = readingRepository
                    .findFirstByRoomIdOrderByReadingDateDescIdDesc(room.getId())
                    .orElse(null);
        }

        Bill bill = existing != null ? existing : new Bill();
        bill.setOwnerId(ownerId);
        bill.setTenantId(tenantId);
        bill.setRoomId(room.getId());
        bill.setBillingMonth(month);
        bill.setRentAmount(room.getMonthlyRent() != null ? room.getMonthlyRent() : BigDecimal.ZERO);

        BigDecimal electricity = BigDecimal.ZERO;
        if (reading != null) {
            bill.setPreviousReading(reading.getPreviousReading());
            bill.setCurrentReading(reading.getCurrentReading());
            bill.setUnitsConsumed(reading.getUnitsConsumed());
            bill.setPricePerUnit(reading.getPricePerUnit());
            electricity = reading.getElectricityAmount();
            bill.setMeterReadingId(reading.getId());
        }
        bill.setElectricityAmount(electricity);
        bill.setOtherCharges(req.otherCharges() != null ? req.otherCharges() : BigDecimal.ZERO);
        bill.setDiscount(req.discount() != null ? req.discount() : BigDecimal.ZERO);

        BigDecimal total = bill.getRentAmount()
                .add(bill.getElectricityAmount())
                .add(bill.getOtherCharges())
                .subtract(bill.getDiscount());
        if (total.signum() < 0) total = BigDecimal.ZERO;
        bill.setTotalAmount(total);

        LocalDate due = req.dueDate() != null
                ? req.dueDate()
                : month.plusMonths(1).withDayOfMonth(10);
        bill.setDueDate(due);

        // Preserve amountPaid on regeneration
        if (existing == null) {
            bill.setAmountPaid(BigDecimal.ZERO);
        }
        recomputeStatus(bill);

        return billRepository.save(bill);
    }

    /**
     * Updates a bill's status based on the amount paid and due date.
     */
    public void recomputeStatus(Bill bill) {
        BigDecimal paid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal total = bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO;

        if (paid.compareTo(total) >= 0 && total.signum() > 0) {
            bill.setStatus(BillStatus.PAID);
        } else if (paid.signum() > 0) {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        } else if (bill.getDueDate() != null && bill.getDueDate().isBefore(LocalDate.now())) {
            bill.setStatus(BillStatus.OVERDUE);
        } else {
            bill.setStatus(BillStatus.UNPAID);
        }
    }

    public BigDecimal outstanding(Bill bill) {
        BigDecimal paid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remaining = bill.getTotalAmount().subtract(paid);
        return remaining.signum() < 0 ? BigDecimal.ZERO : remaining;
    }

    public void save(Bill bill) {
        billRepository.save(bill);
    }
}
