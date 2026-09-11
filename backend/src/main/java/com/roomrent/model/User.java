package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
@Getter
@Setter
public class User {

    @Id
    private Long id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String phone;

    private String passwordHash;

    private Role role = Role.OWNER;

    // For tenant logins: links a user account to a tenant record
    private Long tenantId;

    // When true, the user must set a new password before using the app
    private boolean mustChangePassword = false;

    private Instant createdAt = Instant.now();
}
