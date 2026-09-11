package com.roomrent.repository;

import com.roomrent.model.Bill;
import com.roomrent.model.BillStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends MongoRepository<Bill, Long> {
    List<Bill> findByOwnerIdOrderByBillingMonthDescIdDesc(Long ownerId);
    List<Bill> findByTenantIdOrderByBillingMonthDescIdDesc(Long tenantId);
    List<Bill> findByRoomIdOrderByBillingMonthDescIdDesc(Long roomId);
    Optional<Bill> findByTenantIdAndRoomIdAndBillingMonth(Long tenantId, Long roomId, LocalDate billingMonth);
    List<Bill> findByOwnerIdAndBillingMonth(Long ownerId, LocalDate billingMonth);
    List<Bill> findByOwnerIdAndStatus(Long ownerId, BillStatus status);
}
