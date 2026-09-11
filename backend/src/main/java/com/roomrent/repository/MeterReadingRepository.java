package com.roomrent.repository;

import com.roomrent.model.MeterReading;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MeterReadingRepository extends MongoRepository<MeterReading, Long> {
    List<MeterReading> findByRoomIdOrderByReadingDateDescIdDesc(Long roomId);
    Optional<MeterReading> findFirstByRoomIdOrderByReadingDateDescIdDesc(Long roomId);
    List<MeterReading> findByTenantIdOrderByReadingDateDescIdDesc(Long tenantId);
    List<MeterReading> findByRoomIdInOrderByReadingDateDescIdDesc(List<Long> roomIds);
}
