package com.roomrent.service.ocr;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Local mock OCR provider used for development and as a safe fallback.
 *
 * It does NOT perform real image recognition. Instead it produces a plausible
 * "detected" reading derived from the previous reading plus a deterministic
 * pseudo consumption based on the image bytes. This keeps the full
 * upload -> detect -> confirm -> calculate workflow testable end-to-end.
 *
 * To use a real engine, implement {@link OcrService} in another bean annotated
 * with @Primary (e.g. calling OpenAI Vision with an API key from env).
 */
@Service
public class MockOcrService implements OcrService {

    @Override
    public OcrResult read(byte[] imageBytes, String contentType, BigDecimal previousReading) {
        BigDecimal base = previousReading != null ? previousReading : BigDecimal.ZERO;

        // Derive a stable pseudo-consumption (60..189 units) from the image content.
        int hash = 0;
        if (imageBytes != null) {
            for (int i = 0; i < imageBytes.length; i += Math.max(1, imageBytes.length / 512)) {
                hash = 31 * hash + (imageBytes[i] & 0xFF);
            }
        }
        int consumption = 60 + Math.floorMod(hash, 130);

        BigDecimal detected = base.add(BigDecimal.valueOf(consumption));
        String reading = detected.stripTrailingZeros().toPlainString();

        return new OcrResult(
                reading,
                0.55,
                "MOCK-OCR detected value: " + reading + " (development stub — please verify)",
                "mock");
    }
}
