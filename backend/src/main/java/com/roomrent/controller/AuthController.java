package com.roomrent.controller;

import com.roomrent.dto.AuthResponse;
import com.roomrent.dto.ChangePasswordRequest;
import com.roomrent.dto.LoginRequest;
import com.roomrent.dto.RegisterRequest;
import com.roomrent.security.CurrentUser;
import com.roomrent.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;

    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/change-password")
    public AuthResponse changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        return authService.changePassword(currentUser.id(), req);
    }
}
