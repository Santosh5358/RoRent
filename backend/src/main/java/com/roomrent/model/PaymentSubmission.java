package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A payment proof submitted by a tenant (e.g. an image of a UPI/bank slip)
 * against one of their bills. The owner reviews it and either approves it
 * (which records a real {@link Payment}) or rejects it.
 */
@Document(collection = "payment_submissions")
@Getter
@Setter
public class PaymentSubmission {

    @Id
    private Long id;

    private Long ownerId;

    private Long tenantId;

    // The bill this payment is for
    private Long billId;

    private PaymentCategory category = PaymentCategory.BOTH;

    private BigDecimal amount = BigDecimal.ZERO;

    private PaymentMethod paymentMethod = PaymentMethod.UPI;

    private String transactionReference;

    private String note;

    // Public URL of the uploaded slip image (e.g. /uploads/slips/abc.png)
    private String slipImageUrl;

    private SubmissionStatus status = SubmissionStatus.PENDING;

    private Instant submittedAt = Instant.now();

    private Instant reviewedAt;

    private Long reviewedBy;

    private String reviewNote;

    // The payment created when this submission is approved
    private Long paymentId;
}
