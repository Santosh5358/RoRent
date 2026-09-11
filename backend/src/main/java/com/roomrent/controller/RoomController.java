package com.roomrent.controller;

import com.roomrent.dto.RoomRequest;
import com.roomrent.model.Room;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@PreAuthorize("hasRole('OWNER')")
public class RoomController {

    private final RoomService roomService;
    private final CurrentUser currentUser;

    public RoomController(RoomService roomService, CurrentUser currentUser) {
        this.roomService = roomService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Room> list(@RequestParam(required = false) Long propertyId) {
        if (propertyId != null) {
            return roomService.listByProperty(currentUser.id(), propertyId);
        }
        return roomService.listAll(currentUser.id());
    }

    @GetMapping("/{id}")
    public Room get(@PathVariable Long id) {
        return roomService.get(currentUser.id(), id);
    }

    @PostMapping
    public Room create(@Valid @RequestBody RoomRequest req) {
        return roomService.create(currentUser.id(), req);
    }

    @PutMapping("/{id}")
    public Room update(@PathVariable Long id, @Valid @RequestBody RoomRequest req) {
        return roomService.update(currentUser.id(), id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        roomService.delete(currentUser.id(), id);
    }
}
