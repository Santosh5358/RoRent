package com.roomrent.repository;

import com.roomrent.model.ElectricityRate;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ElectricityRateRepository extends MongoRepository<ElectricityRate, Long> {
    List<ElectricityRate> findByOwnerIdOrderByEffectiveFromDesc(Long ownerId);
    List<ElectricityRate> findByRoomIdOrderByEffectiveFromDesc(Long roomId);
    List<ElectricityRate> findByPropertyIdOrderByEffectiveFromDesc(Long propertyId);
}
