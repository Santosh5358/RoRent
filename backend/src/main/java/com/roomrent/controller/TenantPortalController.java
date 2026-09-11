package com.roomrent.controller;

import com.roomrent.dto.TenantProfileResponse;
import com.roomrent.model.*;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.PaymentSubmissionService;
import com.roomrent.service.TenantPortalService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * Tenant-facing portal. Tenants can view their own rent, electricity rate,
 * bills, readings and payments, and submit payment slips for approval.
 */
@RestController
@RequestMapping("/api/portal")
@PreAuthorize("hasRole('TENANT')")
public class TenantPortalController {

    private final TenantPortalService portalService;
    private final PaymentSubmissionService submissionService;
    private final CurrentUser currentUser;

    public TenantPortalController(TenantPortalService portalService,
                                  PaymentSubmissionService submissionService,
                                  CurrentUser currentUser) {
        this.portalService = portalService;
        this.submissionService = submissionService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    public TenantProfileResponse me() {
        return portalService.profile(currentUser.tenantId());
    }

    @GetMapping("/bills")
    public List<Bill> bills() {
        return portalService.bills(currentUser.tenantId());
    }

    @GetMapping("/bills/{id}")
    public Bill bill(@PathVariable Long id) {
        return portalService.bill(currentUser.tenantId(), id);
    }

    @GetMapping("/bills/{id}/receipt")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id) {
        byte[] pdf = portalService.receipt(currentUser.tenantId(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bill-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/readings")
    public List<MeterReading> readings() {
        return portalService.readings(currentUser.tenantId());
    }

    @GetMapping("/payments")
    public List<Payment> payments() {
        return portalService.payments(currentUser.tenantId());
    }

    @GetMapping("/submissions")
    public List<PaymentSubmission> submissions() {
        return submissionService.listForTenant(currentUser.tenantId());
    }

    @PostMapping(value = "/submissions", consumes = "multipart/form-data")
    public PaymentSubmission submit(@RequestParam Long billId,
                                    @RequestParam(required = false) PaymentCategory category,
                                    @RequestParam BigDecimal amount,
                                    @RequestParam(required = false) PaymentMethod paymentMethod,
                                    @RequestParam(required = false) String transactionReference,
                                    @RequestParam(required = false) String note,
                                    @RequestPart("slip") MultipartFile slip) {
        return submissionService.createByTenant(
                currentUser.tenantId(), billId, category, amount,
                paymentMethod, transactionReference, note, slip);
    }
}
