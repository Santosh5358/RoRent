package com.roomrent.service;

import com.roomrent.dto.ElectricityRateRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.ElectricityRate;
import com.roomrent.model.Property;
import com.roomrent.model.Room;
import com.roomrent.repository.ElectricityRateRepository;
import com.roomrent.repository.PropertyRepository;
import com.roomrent.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Resolves the electricity price that applies to a room on a given date.
 *
 * Resolution order (most specific + most recent wins):
 *   1. Room-level effective rate
 *   2. Property-level effective rate
 *   3. Room.electricityRate
 *   4. Property.defaultElectricityRate
 *   5. Zero
 */
@Service
public class ElectricityRateService {

    private final ElectricityRateRepository rateRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;

    public ElectricityRateService(ElectricityRateRepository rateRepository,
                                  RoomRepository roomRepository,
                                  PropertyRepository propertyRepository) {
        this.rateRepository = rateRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
    }

    public BigDecimal resolveRate(Room room, LocalDate date) {
        // 1. Room-level effective rate
        BigDecimal roomRate = pickEffective(rateRepository.findByRoomIdOrderByEffectiveFromDesc(room.getId()), date);
        if (roomRate != null) return roomRate;

        // 2. Property-level effective rate
        BigDecimal propRate = pickEffective(
                rateRepository.findByPropertyIdOrderByEffectiveFromDesc(room.getPropertyId()), date);
        if (propRate != null) return propRate;

        // 3. Room default
        if (room.getElectricityRate() != null && room.getElectricityRate().signum() > 0) {
            return room.getElectricityRate();
        }

        // 4. Property default
        Property property = propertyRepository.findById(room.getPropertyId()).orElse(null);
        if (property != null && property.getDefaultElectricityRate() != null
                && property.getDefaultElectricityRate().signum() > 0) {
            return property.getDefaultElectricityRate();
        }

        // 5. Fallback
        return BigDecimal.ZERO;
    }

    private BigDecimal pickEffective(List<ElectricityRate> rates, LocalDate date) {
        return rates.stream()
                .filter(r -> !r.getEffectiveFrom().isAfter(date))
                .filter(r -> r.getEffectiveTo() == null || !r.getEffectiveTo().isBefore(date))
                .max(Comparator.comparing(ElectricityRate::getEffectiveFrom))
                .map(ElectricityRate::getPricePerUnit)
                .orElse(null);
    }

    public List<ElectricityRate> list(Long ownerId) {
        return rateRepository.findByOwnerIdOrderByEffectiveFromDesc(ownerId);
    }

    public ElectricityRate create(Long ownerId, ElectricityRateRequest req) {
        if (req.roomId() == null && req.propertyId() == null) {
            throw ApiException.badRequest("Provide a propertyId or roomId for the rate");
        }
        // Validate ownership of referenced room/property
        if (req.roomId() != null) {
            Room room = roomRepository.findById(req.roomId())
                    .orElseThrow(() -> ApiException.notFound("Room not found"));
            Property p = propertyRepository.findById(room.getPropertyId())
                    .orElseThrow(() -> ApiException.notFound("Property not found"));
            if (!p.getOwnerId().equals(ownerId)) throw ApiException.forbidden("Not your room");
        }
        if (req.propertyId() != null) {
            Property p = propertyRepository.findById(req.propertyId())
                    .orElseThrow(() -> ApiException.notFound("Property not found"));
            if (!p.getOwnerId().equals(ownerId)) throw ApiException.forbidden("Not your property");
        }

        ElectricityRate rate = new ElectricityRate();
        rate.setOwnerId(ownerId);
        rate.setPropertyId(req.propertyId());
        rate.setRoomId(req.roomId());
        rate.setPricePerUnit(req.pricePerUnit());
        rate.setEffectiveFrom(req.effectiveFrom());
        rate.setEffectiveTo(req.effectiveTo());
        return rateRepository.save(rate);
    }
}
