package com.roomrent.service.ocr;

/**
 * Pluggable OCR provider. Swap the implementation (e.g. OpenAI Vision, Google
 * Vision, Tesseract) by providing another bean marked @Primary. The rest of the
 * application only depends on this interface.
 */
public interface OcrService {

    /**
     * Attempt to read the meter value from the raw image bytes.
     *
     * @param imageBytes    the uploaded image content
     * @param contentType   MIME type, e.g. image/png
     * @param previousReading the last known reading, used as a hint/fallback
     * @return an {@link OcrResult}; never null. detectedReading may be null.
     */
    OcrResult read(byte[] imageBytes, String contentType, java.math.BigDecimal previousReading);
}
