package com.roomrent.repository;

import com.roomrent.model.PaymentSubmission;
import com.roomrent.model.SubmissionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PaymentSubmissionRepository extends MongoRepository<PaymentSubmission, Long> {
    List<PaymentSubmission> findByOwnerIdOrderBySubmittedAtDescIdDesc(Long ownerId);
    List<PaymentSubmission> findByOwnerIdAndStatusOrderBySubmittedAtDescIdDesc(Long ownerId, SubmissionStatus status);
    List<PaymentSubmission> findByTenantIdOrderBySubmittedAtDescIdDesc(Long tenantId);
    long countByOwnerIdAndStatus(Long ownerId, SubmissionStatus status);
}
