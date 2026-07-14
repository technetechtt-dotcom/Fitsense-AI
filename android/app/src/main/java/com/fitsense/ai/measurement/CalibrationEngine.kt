package com.fitsense.ai.measurement

import com.fitsense.ai.models.CalibrationReference
import javax.inject.Inject
import kotlin.math.hypot

/**
 * Derives a pixels-per-millimetre scale factor that the measurement engine uses
 * to convert pixel distances into real-world millimetres.
 *
 * Two strategies:
 *   1. ARCore — the session reports the distance to the detected floor plane;
 *      combined with camera intrinsics, that yields a true world scale.
 *   2. Reference card (A4 / credit card) — we measure the known object in
 *      pixels and divide by its real-world dimensions.
 */
class CalibrationEngine @Inject constructor() {

    data class Calibration(
        val pixelsPerMm: Double,
        val reference: CalibrationReference,
        val confidence: Float,
    )

    /** Build calibration from a measured reference card bounding box. */
    fun fromReferenceCard(
        cardWidthPx: Double,
        cardHeightPx: Double,
        reference: CalibrationReference,
    ): Calibration {
        require(reference != CalibrationReference.ARCORE_PLANE) {
            "Use fromArCore() for ARCORE_PLANE."
        }
        // Pick the longer side to reduce the impact of a slightly tilted reference.
        val cardDiagPx = hypot(cardWidthPx, cardHeightPx)
        val cardDiagMm = hypot(reference.widthMm, reference.heightMm)
        val pxPerMm = cardDiagPx / cardDiagMm

        // Confidence is highest when the card's aspect ratio is close to expected.
        val measuredRatio = if (cardHeightPx == 0.0) 1.0 else cardWidthPx / cardHeightPx
        val ratioDelta = kotlin.math.abs(measuredRatio - reference.aspectRatio) /
            reference.aspectRatio.coerceAtLeast(1e-3)
        val confidence = (1f - ratioDelta.toFloat().coerceIn(0f, 1f))

        return Calibration(pxPerMm, reference, confidence)
    }

    /**
     * Build calibration from an ARCore frame.
     *
     * @param focalLengthPx camera focal length in pixels (from camera intrinsics).
     * @param planeDistanceMeters distance from camera to the detected plane.
     * @return px/mm scale at the plane's depth.
     */
    fun fromArCore(focalLengthPx: Double, planeDistanceMeters: Double): Calibration {
        // For an object lying on the plane: real_size = pixel_size * distance / focal_length.
        // So pixels per metre at that distance = focal / distance.
        val pxPerMetre = focalLengthPx / planeDistanceMeters.coerceAtLeast(1e-3)
        val pxPerMm = pxPerMetre / 1000.0
        val confidence = (0.9f - (planeDistanceMeters.toFloat() - 0.4f).coerceAtLeast(0f) * 0.2f)
            .coerceIn(0.4f, 0.95f)
        return Calibration(pxPerMm, CalibrationReference.ARCORE_PLANE, confidence)
    }
}
