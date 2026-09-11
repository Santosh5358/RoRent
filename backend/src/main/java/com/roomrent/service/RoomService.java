package com.roomrent.service;

import com.roomrent.dto.RoomRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.Property;
import com.roomrent.model.Room;
import com.roomrent.model.RoomStatus;
import com.roomrent.repository.PropertyRepository;
import com.roomrent.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;

    public RoomService(RoomRepository roomRepository, PropertyRepository propertyRepository) {
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
    }

    private void assertOwnsProperty(Long ownerId, Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your property");
        }
    }

    public List<Room> listByProperty(Long ownerId, Long propertyId) {
        assertOwnsProperty(ownerId, propertyId);
        return roomRepository.findByPropertyIdOrderByRoomNumberAsc(propertyId);
    }

    public List<Room> listAll(Long ownerId) {
        List<Long> propertyIds = propertyRepository.findByOwnerIdOrderByNameAsc(ownerId)
                .stream().map(Property::getId).toList();
        if (propertyIds.isEmpty()) return List.of();
        return roomRepository.findByPropertyIdIn(propertyIds);
    }

    public Room get(Long ownerId, Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Room not found"));
        assertOwnsProperty(ownerId, room.getPropertyId());
        return room;
    }

    public Room create(Long ownerId, RoomRequest req) {
        assertOwnsProperty(ownerId, req.propertyId());
        Room room = new Room();
        room.setPropertyId(req.propertyId());
        apply(room, req);
        return roomRepository.save(room);
    }

    public Room update(Long ownerId, Long id, RoomRequest req) {
        Room room = get(ownerId, id);
        apply(room, req);
        return roomRepository.save(room);
    }

    public void delete(Long ownerId, Long id) {
        Room room = get(ownerId, id);
        roomRepository.delete(room);
    }

    private void apply(Room room, RoomRequest req) {
        room.setRoomNumber(req.roomNumber());
        room.setFloor(req.floor());
        if (req.monthlyRent() != null) room.setMonthlyRent(req.monthlyRent());
        room.setElectricityRate(req.electricityRate());
        if (req.electricityBillingMethod() != null) {
            room.setElectricityBillingMethod(req.electricityBillingMethod());
        }
        if (req.status() != null) {
            room.setStatus(req.status());
            if (req.status() != RoomStatus.OCCUPIED) {
                // clearing current tenant handled by tenant assignment flow
            }
        }
    }
}
