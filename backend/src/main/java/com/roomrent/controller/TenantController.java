package com.roomrent.controller;

import com.roomrent.dto.AssignRoomRequest;
import com.roomrent.dto.TenantRequest;
import com.roomrent.model.Tenant;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@PreAuthorize("hasRole('OWNER')")
public class TenantController {

    private final TenantService tenantService;
    private final CurrentUser currentUser;

    public TenantController(TenantService tenantService, CurrentUser currentUser) {
        this.tenantService = tenantService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Tenant> list() {
        return tenantService.list(currentUser.id());
    }

    @GetMapping("/{id}")
    public Tenant get(@PathVariable Long id) {
        return tenantService.get(currentUser.id(), id);
    }

    @PostMapping
    public Tenant create(@Valid @RequestBody TenantRequest req) {
        return tenantService.create(currentUser.id(), req);
    }

    @PutMapping("/{id}")
    public Tenant update(@PathVariable Long id, @Valid @RequestBody TenantRequest req) {
        return tenantService.update(currentUser.id(), id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        tenantService.delete(currentUser.id(), id);
    }

    @PostMapping("/{id}/assign")
    public Tenant assign(@PathVariable Long id, @Valid @RequestBody AssignRoomRequest req) {
        return tenantService.assignRoom(currentUser.id(), id, req);
    }

    @PostMapping("/{id}/unassign")
    public Tenant unassign(@PathVariable Long id) {
        return tenantService.unassignRoom(currentUser.id(), id);
    }

    @PostMapping("/{id}/reset-password")
    public Map<String, String> resetPassword(@PathVariable Long id) {
        String password = tenantService.resetPassword(currentUser.id(), id);
        return Map.of("password", password);
    }
}
