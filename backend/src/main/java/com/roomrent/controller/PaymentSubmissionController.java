package com.roomrent.controller;

import com.roomrent.dto.RejectSubmissionRequest;
import com.roomrent.model.PaymentSubmission;
import com.roomrent.model.SubmissionStatus;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.PaymentSubmissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Owner endpoints to review tenant-submitted payment slips.
 */
@RestController
@RequestMapping("/api/payment-submissions")
@PreAuthorize("hasRole('OWNER')")
public class PaymentSubmissionController {

    private final PaymentSubmissionService service;
    private final CurrentUser currentUser;

    public PaymentSubmissionController(PaymentSubmissionService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<PaymentSubmission> list(@RequestParam(required = false) SubmissionStatus status) {
        return service.listForOwner(currentUser.id(), status);
    }

    @GetMapping("/pending-count")
    public Map<String, Long> pendingCount() {
        return Map.of("pending", service.pendingCount(currentUser.id()));
    }

    @PostMapping("/{id}/approve")
    public PaymentSubmission approve(@PathVariable Long id,
                                     @RequestBody(required = false) RejectSubmissionRequest body) {
        String note = body != null ? body.reason() : null;
        return service.approve(currentUser.id(), currentUser.id(), id, note);
    }

    @PostMapping("/{id}/reject")
    public PaymentSubmission reject(@PathVariable Long id,
                                    @RequestBody(required = false) RejectSubmissionRequest body) {
        String reason = body != null ? body.reason() : null;
        return service.reject(currentUser.id(), currentUser.id(), id, reason);
    }
}
