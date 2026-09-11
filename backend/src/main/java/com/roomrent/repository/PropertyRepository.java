package com.roomrent.repository;

import com.roomrent.model.Property;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PropertyRepository extends MongoRepository<Property, Long> {
    List<Property> findByOwnerIdOrderByNameAsc(Long ownerId);
    long countByOwnerId(Long ownerId);
}
