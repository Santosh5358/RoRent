package com.roomrent.service;

import com.roomrent.dto.MeterReadingRequest;
import com.roomrent.dto.OcrScanResponse;
import com.roomrent.exception.ApiException;
import com.roomrent.model.MeterReading;
import com.roomrent.model.ReadingSource;
import com.roomrent.model.Room;
import com.roomrent.repository.MeterReadingRepository;
import com.roomrent.repository.PropertyRepository;
import com.roomrent.repository.RoomRepository;
import com.roomrent.service.ocr.OcrResult;
import com.roomrent.service.ocr.OcrService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MeterReadingService {

    private final MeterReadingRepository readingRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final FileStorageService fileStorageService;
    private final OcrService ocrService;
    private final ElectricityRateService rateService;

    public MeterReadingService(MeterReadingRepository readingRepository,
                               RoomRepository roomRepository,
                               PropertyRepository propertyRepository,
                               FileStorageService fileStorageService,
                               OcrService ocrService,
                               ElectricityRateService rateService) {
        this.readingRepository = readingRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
        this.fileStorageService = fileStorageService;
        this.ocrService = ocrService;
        this.rateService = rateService;
    }

    private Room ownedRoom(Long ownerId, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("Room not found"));
        var property = propertyRepository.findById(room.getPropertyId())
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your room");
        }
        return room;
    }

    public BigDecimal previousReadingFor(Long roomId) {
        return readingRepository.findFirstByRoomIdOrderByReadingDateDescIdDesc(roomId)
                .map(MeterReading::getCurrentReading)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Step 3-4 of the workflow: upload image and run OCR. Nothing is persisted
     * as a reading yet — the landlord must confirm/edit and then save.
     */
    public OcrScanResponse scan(Long ownerId, Long roomId, MultipartFile image) {
        Room room = ownedRoom(ownerId, roomId);
        String imageUrl = fileStorageService.storeMeterImage(image);
        BigDecimal previous = previousReadingFor(roomId);

        OcrResult result;
        try {
            result = ocrService.read(image.getBytes(), image.getContentType(), previous);
        } catch (Exception e) {
            result = new OcrResult(null, 0.0, "OCR failed: " + e.getMessage(), "error");
        }

        BigDecimal rate = rateService.resolveRate(room, LocalDate.now());

        return new OcrScanResponse(
                imageUrl,
                previous,
                result.detectedReading(),
                result.confidence(),
                result.provider(),
                result.rawText(),
                rate);
    }

    public List<MeterReading> listByRoom(Long ownerId, Long roomId) {
        ownedRoom(ownerId, roomId);
        return readingRepository.findByRoomIdOrderByReadingDateDescIdDesc(roomId);
    }

    public List<MeterReading> listAll(Long ownerId) {
        List<Long> roomIds = roomRepository.findByPropertyIdIn(
                propertyRepository.findByOwnerIdOrderByNameAsc(ownerId)
                        .stream().map(p -> p.getId()).toList())
                .stream().map(Room::getId).toList();
        if (roomIds.isEmpty()) return List.of();
        return readingRepository.findByRoomIdInOrderByReadingDateDescIdDesc(roomIds);
    }

    /**
     * Steps 5-8: persist the confirmed reading and calculate consumption + charge.
     * Enforces the business rule that current >= previous unless it is a meter
     * reset or the landlord explicitly confirmed a lower reading.
     */
    public MeterReading save(Long ownerId, MeterReadingRequest req) {
        Room room = ownedRoom(ownerId, req.roomId());
        BigDecimal previous = previousReadingFor(req.roomId());
        BigDecimal current = req.currentReading();

        if (current == null || current.signum() < 0) {
            throw ApiException.badRequest("Current reading must be a non-negative number");
        }

        BigDecimal units;
        if (req.meterReset()) {
            // Meter replaced/reset: consumption is the new meter's own value
            units = current;
            previous = BigDecimal.ZERO;
        } else {
            if (current.compareTo(previous) < 0 && !req.confirmLowerReading()) {
                throw ApiException.badRequest(
                        "Current meter reading is lower than the previous reading. Please verify the reading.");
            }
            units = current.subtract(previous);
            if (units.signum() < 0) units = BigDecimal.ZERO;
        }

        BigDecimal rate = req.pricePerUnit() != null
                ? req.pricePerUnit()
                : rateService.resolveRate(room, req.readingDate());

        BigDecimal amount = units.multiply(rate);

        MeterReading reading = new MeterReading();
        reading.setRoomId(room.getId());
        reading.setTenantId(room.getCurrentTenantId());
        reading.setReadingDate(req.readingDate());
        reading.setPreviousReading(previous);
        reading.setCurrentReading(current);
        reading.setUnitsConsumed(units);
        reading.setPricePerUnit(rate);
        reading.setElectricityAmount(amount);
        reading.setImageUrl(req.imageUrl());
        reading.setReadingSource(req.readingSource() != null ? req.readingSource() : ReadingSource.MANUAL);
        reading.setOcrDetectedReading(req.ocrDetectedReading());
        reading.setMeterReset(req.meterReset());
        reading.setCreatedBy(ownerId);
        return readingRepository.save(reading);
    }
}
