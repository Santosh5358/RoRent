package com.roomrent.repository;

import com.roomrent.model.Room;
import com.roomrent.model.RoomStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RoomRepository extends MongoRepository<Room, Long> {
    List<Room> findByPropertyIdOrderByRoomNumberAsc(Long propertyId);
    List<Room> findByPropertyIdIn(List<Long> propertyIds);
    long countByPropertyIdIn(List<Long> propertyIds);
    long countByPropertyIdInAndStatus(List<Long> propertyIds, RoomStatus status);
}
