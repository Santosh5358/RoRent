package com.roomrent.repository;

import com.roomrent.model.RoomAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RoomAssignmentRepository extends MongoRepository<RoomAssignment, Long> {
    List<RoomAssignment> findByRoomIdOrderByStartDateDesc(Long roomId);
    List<RoomAssignment> findByTenantIdOrderByStartDateDesc(Long tenantId);
}
