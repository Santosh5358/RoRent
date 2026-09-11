package com.roomrent.security;

import com.roomrent.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Convenience accessor for the currently authenticated user.
 */
@Component
public class CurrentUser {

    public AuthenticatedUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw ApiException.forbidden("Not authenticated");
        }
        return principal;
    }

    public Long id() {
        return get().userId();
    }

    public Long tenantId() {
        return get().tenantId();
    }

    public boolean isOwner() {
        return "OWNER".equals(get().role());
    }

    public boolean isTenant() {
        return "TENANT".equals(get().role());
    }
}
