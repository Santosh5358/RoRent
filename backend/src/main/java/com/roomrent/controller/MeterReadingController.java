package com.roomrent.controller;

import com.roomrent.dto.MeterReadingRequest;
import com.roomrent.dto.OcrScanResponse;
import com.roomrent.model.MeterReading;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.MeterReadingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meter-readings")
@PreAuthorize("hasRole('OWNER')")
public class MeterReadingController {

    private final MeterReadingService readingService;
    private final CurrentUser currentUser;

    public MeterReadingController(MeterReadingService readingService, CurrentUser currentUser) {
        this.readingService = readingService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<MeterReading> list(@RequestParam(required = false) Long roomId) {
        if (roomId != null) {
            return readingService.listByRoom(currentUser.id(), roomId);
        }
        return readingService.listAll(currentUser.id());
    }

    @GetMapping("/previous")
    public Map<String, BigDecimal> previous(@RequestParam Long roomId) {
        return Map.of("previousReading", readingService.previousReadingFor(roomId));
    }

    /**
     * Upload a meter image and run OCR. Returns the detected reading for the
     * landlord to confirm or edit; nothing is saved yet.
     */
    @PostMapping(value = "/scan", consumes = "multipart/form-data")
    public OcrScanResponse scan(@RequestParam Long roomId,
                                @RequestPart("image") MultipartFile image) {
        return readingService.scan(currentUser.id(), roomId, image);
    }

    @PostMapping
    public MeterReading save(@Valid @RequestBody MeterReadingRequest req) {
        return readingService.save(currentUser.id(), req);
    }
}
