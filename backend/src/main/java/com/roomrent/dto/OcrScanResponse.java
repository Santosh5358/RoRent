package com.roomrent.dto;

import java.math.BigDecimal;

/**
 * Response returned after scanning an uploaded meter image.
 * The detected reading must be confirmed/edited by the landlord before saving.
 */
public record OcrScanResponse(
        String imageUrl,
        BigDecimal previousReading,
        String detectedReading,
        double confidence,
        String provider,
        String rawText,
        BigDecimal appliedRate) {
}
