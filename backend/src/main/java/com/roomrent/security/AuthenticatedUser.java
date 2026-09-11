package com.roomrent.security;

/**
 * Lightweight principal stored in the SecurityContext after JWT authentication.
 */
public record AuthenticatedUser(Long userId, String email, String role, Long tenantId) {
}
