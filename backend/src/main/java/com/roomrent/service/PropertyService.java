package com.roomrent.service;

import com.roomrent.dto.PropertyRequest;
import com.roomrent.exception.ApiException;
import com.roomrent.model.Property;
import com.roomrent.repository.PropertyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    public List<Property> list(Long ownerId) {
        return propertyRepository.findByOwnerIdOrderByNameAsc(ownerId);
    }

    public Property get(Long ownerId, Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your property");
        }
        return property;
    }

    public Property create(Long ownerId, PropertyRequest req) {
        Property property = new Property();
        property.setOwnerId(ownerId);
        apply(property, req);
        return propertyRepository.save(property);
    }

    public Property update(Long ownerId, Long id, PropertyRequest req) {
        Property property = get(ownerId, id);
        apply(property, req);
        return propertyRepository.save(property);
    }

    public void delete(Long ownerId, Long id) {
        Property property = get(ownerId, id);
        propertyRepository.delete(property);
    }

    private void apply(Property property, PropertyRequest req) {
        property.setName(req.name());
        property.setAddress(req.address());
        property.setDefaultElectricityRate(req.defaultElectricityRate());
    }
}
