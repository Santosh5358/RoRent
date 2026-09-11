package com.roomrent.service.ocr;

/**
 * Result of an OCR attempt on a meter image.
 *
 * @param detectedReading the numeric reading detected, or null if none
 * @param confidence      0.0 - 1.0 confidence score
 * @param rawText         raw text returned by the OCR engine (audit trail)
 * @param provider        which provider produced this result
 */
public record OcrResult(String detectedReading, double confidence, String rawText, String provider) {
}
