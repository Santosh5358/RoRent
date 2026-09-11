package com.roomrent.service;

import com.roomrent.dto.AuthResponse;
import com.roomrent.dto.ChangePasswordRequest;
import com.roomrent.dto.LoginRequest;
import com.roomrent.dto.RegisterRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.Role;
import com.roomrent.model.User;
import com.roomrent.repository.UserRepository;
import com.roomrent.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email().toLowerCase())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email().toLowerCase());
        user.setPhone(req.phone());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.OWNER);
        user = userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.badRequest("Invalid email or password"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.badRequest("Invalid email or password");
        }
        return toResponse(user);
    }

    public AuthResponse changePassword(Long userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.badRequest("Account not found"));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("New password must be different from the current password");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setMustChangePassword(false);
        user = userRepository.save(user);
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getName(),
                user.getEmail(), user.getRole().name(), user.getTenantId(), user.isMustChangePassword());
    }
}
