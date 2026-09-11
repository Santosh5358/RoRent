package com.roomrent.service;

import com.roomrent.dto.PaymentRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.Bill;
import com.roomrent.model.Payment;
import com.roomrent.repository.BillRepository;
import com.roomrent.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;
    private final BillService billService;

    public PaymentService(PaymentRepository paymentRepository,
                          BillRepository billRepository,
                          BillService billService) {
        this.paymentRepository = paymentRepository;
        this.billRepository = billRepository;
        this.billService = billService;
    }

    public List<Payment> list(Long ownerId) {
        return paymentRepository.findByOwnerIdOrderByPaymentDateDescIdDesc(ownerId);
    }

    public List<Payment> listByBill(Long ownerId, Long billId) {
        Bill bill = billService.get(ownerId, billId);
        return paymentRepository.findByBillIdOrderByPaymentDateDescIdDesc(bill.getId());
    }

    /**
     * Records a payment against a bill and updates the bill's paid amount and
     * status. Supports partial payments.
     */
    @Transactional
    public Payment record(Long ownerId, PaymentRequest req) {
        Bill bill = billService.get(ownerId, req.billId());

        BigDecimal newPaid = (bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO)
                .add(req.amount());
        bill.setAmountPaid(newPaid);
        billService.recomputeStatus(bill);
        billRepository.save(bill);

        Payment payment = new Payment();
        payment.setOwnerId(ownerId);
        payment.setBillId(bill.getId());
        payment.setTenantId(bill.getTenantId());
        payment.setAmount(req.amount());
        payment.setPaymentDate(req.paymentDate() != null ? req.paymentDate() : LocalDate.now());
        payment.setPaymentMethod(req.paymentMethod());
        payment.setTransactionReference(req.transactionReference());
        payment.setNotes(req.notes());
        return paymentRepository.save(payment);
    }
}
