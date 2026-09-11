package com.roomrent.controller;

import com.roomrent.dto.PropertyRequest;
import com.roomrent.model.Property;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@PreAuthorize("hasRole('OWNER')")
public class PropertyController {

    private final PropertyService propertyService;
    private final CurrentUser currentUser;

    public PropertyController(PropertyService propertyService, CurrentUser currentUser) {
        this.propertyService = propertyService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Property> list() {
        return propertyService.list(currentUser.id());
    }

    @GetMapping("/{id}")
    public Property get(@PathVariable Long id) {
        return propertyService.get(currentUser.id(), id);
    }

    @PostMapping
    public Property create(@Valid @RequestBody PropertyRequest req) {
        return propertyService.create(currentUser.id(), req);
    }

    @PutMapping("/{id}")
    public Property update(@PathVariable Long id, @Valid @RequestBody PropertyRequest req) {
        return propertyService.update(currentUser.id(), id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        propertyService.delete(currentUser.id(), id);
    }
}
