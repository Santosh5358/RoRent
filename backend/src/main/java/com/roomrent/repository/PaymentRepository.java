package com.roomrent.repository;

import com.roomrent.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PaymentRepository extends MongoRepository<Payment, Long> {
    List<Payment> findByOwnerIdOrderByPaymentDateDescIdDesc(Long ownerId);
    List<Payment> findByBillIdOrderByPaymentDateDescIdDesc(Long billId);
    List<Payment> findByTenantIdOrderByPaymentDateDescIdDesc(Long tenantId);
}
