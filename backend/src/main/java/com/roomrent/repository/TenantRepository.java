package com.roomrent.repository;

import com.roomrent.model.Tenant;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TenantRepository extends MongoRepository<Tenant, Long> {
    List<Tenant> findByOwnerIdOrderByNameAsc(Long ownerId);
    long countByOwnerId(Long ownerId);
}
