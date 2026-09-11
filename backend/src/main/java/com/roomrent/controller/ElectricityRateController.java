package com.roomrent.controller;

import com.roomrent.dto.ElectricityRateRequest;
import com.roomrent.model.ElectricityRate;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.ElectricityRateService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/electricity-rates")
@PreAuthorize("hasRole('OWNER')")
public class ElectricityRateController {

    private final ElectricityRateService rateService;
    private final CurrentUser currentUser;

    public ElectricityRateController(ElectricityRateService rateService, CurrentUser currentUser) {
        this.rateService = rateService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ElectricityRate> list() {
        return rateService.list(currentUser.id());
    }

    @PostMapping
    public ElectricityRate create(@Valid @RequestBody ElectricityRateRequest req) {
        return rateService.create(currentUser.id(), req);
    }
}
