package com.roomrent.controller;

import com.roomrent.dto.PaymentRequest;
import com.roomrent.model.Payment;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('OWNER')")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUser currentUser;

    public PaymentController(PaymentService paymentService, CurrentUser currentUser) {
        this.paymentService = paymentService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Payment> list(@RequestParam(required = false) Long billId) {
        if (billId != null) {
            return paymentService.listByBill(currentUser.id(), billId);
        }
        return paymentService.list(currentUser.id());
    }

    @PostMapping
    public Payment record(@Valid @RequestBody PaymentRequest req) {
        return paymentService.record(currentUser.id(), req);
    }
}
