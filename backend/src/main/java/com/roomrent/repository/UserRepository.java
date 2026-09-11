package com.roomrent.repository;

import com.roomrent.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByTenantId(Long tenantId);
    boolean existsByEmail(String email);
}
