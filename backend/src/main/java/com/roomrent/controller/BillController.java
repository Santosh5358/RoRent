package com.roomrent.controller;

import com.roomrent.dto.GenerateBillRequest;
import com.roomrent.model.Bill;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.BillService;
import com.roomrent.service.ReceiptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@PreAuthorize("hasRole('OWNER')")
public class BillController {

    private final BillService billService;
    private final ReceiptService receiptService;
    private final CurrentUser currentUser;

    public BillController(BillService billService, ReceiptService receiptService, CurrentUser currentUser) {
        this.billService = billService;
        this.receiptService = receiptService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Bill> list(@RequestParam(required = false) Long roomId) {
        if (roomId != null) {
            return billService.listByRoom(currentUser.id(), roomId);
        }
        return billService.list(currentUser.id());
    }

    @GetMapping("/{id}")
    public Bill get(@PathVariable Long id) {
        return billService.get(currentUser.id(), id);
    }

    @PostMapping("/generate")
    public Bill generate(@Valid @RequestBody GenerateBillRequest req) {
        return billService.generate(currentUser.id(), req);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id) {
        byte[] pdf = receiptService.generatePdf(currentUser.id(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bill-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
