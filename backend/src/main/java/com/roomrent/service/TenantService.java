package com.roomrent.service;

import com.roomrent.dto.AssignRoomRequest;
import com.roomrent.dto.TenantRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.*;
import com.roomrent.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TenantService {

    /** Default temporary password assigned to auto-created tenant logins. */
    public static final String DEFAULT_TENANT_PASSWORD = "Welcome@123";

    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final RoomAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantService(TenantRepository tenantRepository,
                         RoomRepository roomRepository,
                         PropertyRepository propertyRepository,
                         RoomAssignmentRepository assignmentRepository,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Tenant> list(Long ownerId) {
        return tenantRepository.findByOwnerIdOrderByNameAsc(ownerId);
    }

    public Tenant get(Long ownerId, Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tenant not found"));
        if (!tenant.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your tenant");
        }
        return tenant;
    }

    public Tenant create(Long ownerId, TenantRequest req) {
        Tenant tenant = new Tenant();
        tenant.setOwnerId(ownerId);
        apply(tenant, req);
        tenant = tenantRepository.save(tenant);
        ensureTenantUser(tenant);
        return tenant;
    }

    public Tenant update(Long ownerId, Long id, TenantRequest req) {
        Tenant tenant = get(ownerId, id);
        apply(tenant, req);
        tenant = tenantRepository.save(tenant);
        ensureTenantUser(tenant);
        return tenant;
    }

    public void delete(Long ownerId, Long id) {
        Tenant tenant = get(ownerId, id);
        userRepository.findByTenantId(tenant.getId()).ifPresent(userRepository::delete);
        tenantRepository.delete(tenant);
    }

    /**
     * Resets a tenant login to the default temporary password and forces a change on next login.
     * Creates the login if it does not exist yet. Returns the temporary password to share.
     */
    public String resetPassword(Long ownerId, Long tenantId) {
        Tenant tenant = get(ownerId, tenantId);
        User user = userRepository.findByTenantId(tenant.getId()).orElse(null);
        if (user == null) {
            ensureTenantUser(tenant);
            user = userRepository.findByTenantId(tenant.getId())
                    .orElseThrow(() -> ApiException.badRequest(
                            "This tenant needs an email address before a login can be created"));
        }
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_TENANT_PASSWORD));
        user.setMustChangePassword(true);
        userRepository.save(user);
        return DEFAULT_TENANT_PASSWORD;
    }

    /**
     * Ensures a tenant has a matching login account. Creates one with a default password
     * (email as username) when the tenant has an email and no login exists yet.
     */
    private void ensureTenantUser(Tenant tenant) {
        if (tenant.getEmail() == null || tenant.getEmail().isBlank()) {
            return;
        }
        String email = tenant.getEmail().trim().toLowerCase();
        User existing = userRepository.findByTenantId(tenant.getId()).orElse(null);
        if (existing != null) {
            // Keep the login in sync with tenant details
            if (!existing.getEmail().equalsIgnoreCase(email) && !userRepository.existsByEmail(email)) {
                existing.setEmail(email);
            }
            existing.setName(tenant.getName());
            existing.setPhone(tenant.getPhone());
            userRepository.save(existing);
            return;
        }
        if (userRepository.existsByEmail(email)) {
            // Email already used by another account; don't hijack it
            return;
        }
        User user = new User();
        user.setName(tenant.getName());
        user.setEmail(email);
        user.setPhone(tenant.getPhone());
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_TENANT_PASSWORD));
        user.setRole(Role.TENANT);
        user.setTenantId(tenant.getId());
        user.setMustChangePassword(true);
        userRepository.save(user);
    }

    private void apply(Tenant tenant, TenantRequest req) {
        tenant.setName(req.name());
        tenant.setPhone(req.phone());
        tenant.setEmail(req.email());
        tenant.setAddress(req.address());
        tenant.setIdDocumentNumber(req.idDocumentNumber());
        tenant.setMoveInDate(req.moveInDate());
        tenant.setMoveOutDate(req.moveOutDate());
        if (req.securityDeposit() != null) tenant.setSecurityDeposit(req.securityDeposit());
    }

    /**
     * Assigns a tenant to a room, preserving the historical assignment record.
     */
    @Transactional
    public Tenant assignRoom(Long ownerId, Long tenantId, AssignRoomRequest req) {
        Tenant tenant = get(ownerId, tenantId);
        Room room = roomRepository.findById(req.roomId())
                .orElseThrow(() -> ApiException.notFound("Room not found"));
        Property property = propertyRepository.findById(room.getPropertyId())
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your room");
        }

        // Close any open assignment currently on this room
        assignmentRepository.findByRoomIdOrderByStartDateDesc(room.getId()).stream()
                .filter(a -> a.getEndDate() == null)
                .forEach(a -> {
                    a.setEndDate(req.startDate());
                    assignmentRepository.save(a);
                });

        BigDecimal rent = req.monthlyRent() != null ? req.monthlyRent() : room.getMonthlyRent();

        RoomAssignment assignment = new RoomAssignment();
        assignment.setRoomId(room.getId());
        assignment.setTenantId(tenant.getId());
        assignment.setStartDate(req.startDate());
        assignment.setMonthlyRent(rent);
        assignmentRepository.save(assignment);

        // Update denormalized pointers
        tenant.setPropertyId(property.getId());
        tenant.setRoomId(room.getId());
        tenant.setMonthlyRent(rent);
        tenant.setStatus(TenantStatus.ACTIVE);
        tenantRepository.save(tenant);

        room.setCurrentTenantId(tenant.getId());
        room.setStatus(RoomStatus.OCCUPIED);
        if (rent != null && rent.signum() > 0) room.setMonthlyRent(rent);
        roomRepository.save(room);

        return tenant;
    }

    /**
     * Marks a tenant as moved out, freeing the room but keeping history.
     */
    @Transactional
    public Tenant unassignRoom(Long ownerId, Long tenantId) {
        Tenant tenant = get(ownerId, tenantId);
        Long roomId = tenant.getRoomId();
        if (roomId != null) {
            assignmentRepository.findByRoomIdOrderByStartDateDesc(roomId).stream()
                    .filter(a -> a.getEndDate() == null && a.getTenantId().equals(tenantId))
                    .forEach(a -> {
                        a.setEndDate(java.time.LocalDate.now());
                        assignmentRepository.save(a);
                    });
            roomRepository.findById(roomId).ifPresent(room -> {
                room.setCurrentTenantId(null);
                room.setStatus(RoomStatus.VACANT);
                roomRepository.save(room);
            });
        }
        tenant.setRoomId(null);
        tenant.setPropertyId(null);
        tenant.setStatus(TenantStatus.INACTIVE);
        tenant.setMoveOutDate(java.time.LocalDate.now());
        return tenantRepository.save(tenant);
    }
}
