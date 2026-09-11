package com.roomrent.service;

import com.roomrent.dto.PaymentRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.*;
import com.roomrent.repository.BillRepository;
import com.roomrent.repository.PaymentSubmissionRepository;
import com.roomrent.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class PaymentSubmissionService {

    private final PaymentSubmissionRepository submissionRepository;
    private final BillRepository billRepository;
    private final TenantRepository tenantRepository;
    private final FileStorageService fileStorageService;
    private final PaymentService paymentService;

    public PaymentSubmissionService(PaymentSubmissionRepository submissionRepository,
                                    BillRepository billRepository,
                                    TenantRepository tenantRepository,
                                    FileStorageService fileStorageService,
                                    PaymentService paymentService) {
        this.submissionRepository = submissionRepository;
        this.billRepository = billRepository;
        this.tenantRepository = tenantRepository;
        this.fileStorageService = fileStorageService;
        this.paymentService = paymentService;
    }

    // ---- Tenant side ----------------------------------------------------

    @Transactional
    public PaymentSubmission createByTenant(Long tenantId, Long billId, PaymentCategory category,
                                            BigDecimal amount, PaymentMethod method,
                                            String transactionReference, String note,
                                            MultipartFile slip) {
        if (tenantId == null) {
            throw ApiException.forbidden("No tenant is linked to this account");
        }
        if (amount == null || amount.signum() <= 0) {
            throw ApiException.badRequest("Enter a valid payment amount");
        }
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> ApiException.notFound("Tenant not found"));

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> ApiException.notFound("Bill not found"));
        if (!bill.getTenantId().equals(tenantId)) {
            throw ApiException.forbidden("This bill does not belong to you");
        }

        String url = fileStorageService.storeSlipImage(slip);

        PaymentSubmission s = new PaymentSubmission();
        s.setOwnerId(tenant.getOwnerId());
        s.setTenantId(tenantId);
        s.setBillId(bill.getId());
        s.setCategory(category != null ? category : PaymentCategory.BOTH);
        s.setAmount(amount);
        s.setPaymentMethod(method != null ? method : PaymentMethod.UPI);
        s.setTransactionReference(transactionReference);
        s.setNote(note);
        s.setSlipImageUrl(url);
        s.setStatus(SubmissionStatus.PENDING);
        s.setSubmittedAt(Instant.now());
        return submissionRepository.save(s);
    }

    public List<PaymentSubmission> listForTenant(Long tenantId) {
        return submissionRepository.findByTenantIdOrderBySubmittedAtDescIdDesc(tenantId);
    }

    // ---- Owner side -----------------------------------------------------

    public List<PaymentSubmission> listForOwner(Long ownerId, SubmissionStatus status) {
        if (status != null) {
            return submissionRepository.findByOwnerIdAndStatusOrderBySubmittedAtDescIdDesc(ownerId, status);
        }
        return submissionRepository.findByOwnerIdOrderBySubmittedAtDescIdDesc(ownerId);
    }

    public long pendingCount(Long ownerId) {
        return submissionRepository.countByOwnerIdAndStatus(ownerId, SubmissionStatus.PENDING);
    }

    private PaymentSubmission ownedPending(Long ownerId, Long id) {
        PaymentSubmission s = submissionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Submission not found"));
        if (!s.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your submission");
        }
        if (s.getStatus() != SubmissionStatus.PENDING) {
            throw ApiException.badRequest("This submission has already been reviewed");
        }
        return s;
    }

    /**
     * Approves a tenant's payment slip: records a real payment against the bill
     * (updating its paid amount and status) and marks the submission approved.
     */
    @Transactional
    public PaymentSubmission approve(Long ownerId, Long reviewerUserId, Long id, String reviewNote) {
        PaymentSubmission s = ownedPending(ownerId, id);

        PaymentRequest req = new PaymentRequest(
                s.getBillId(), s.getAmount(), null, s.getPaymentMethod(),
                s.getTransactionReference(),
                buildPaymentNote(s, note(reviewNote)));
        Payment payment = paymentService.record(ownerId, req);

        s.setStatus(SubmissionStatus.APPROVED);
        s.setReviewedAt(Instant.now());
        s.setReviewedBy(reviewerUserId);
        s.setReviewNote(note(reviewNote));
        s.setPaymentId(payment.getId());
        return submissionRepository.save(s);
    }

    @Transactional
    public PaymentSubmission reject(Long ownerId, Long reviewerUserId, Long id, String reason) {
        PaymentSubmission s = ownedPending(ownerId, id);
        s.setStatus(SubmissionStatus.REJECTED);
        s.setReviewedAt(Instant.now());
        s.setReviewedBy(reviewerUserId);
        s.setReviewNote(note(reason));
        return submissionRepository.save(s);
    }

    private String note(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private String buildPaymentNote(PaymentSubmission s, String reviewNote) {
        StringBuilder sb = new StringBuilder("Tenant submission #").append(s.getId());
        if (s.getNote() != null && !s.getNote().isBlank()) {
            sb.append(" – ").append(s.getNote().trim());
        }
        if (reviewNote != null) {
            sb.append(" (owner: ").append(reviewNote).append(')');
        }
        return sb.toString();
    }
}
