package com.fitsense.ai.measurement

import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.utils.Constants
import javax.inject.Inject

/**
 * Final acceptance gate before persisting a measurement.
 * Rejects demo-quality or low-confidence outputs.
 */
class MeasurementValidator @Inject constructor() {

    data class ValidationResult(
        val accepted: Boolean,
        val issue: String?,
    )

    fun validate(
        measurement: FootMeasurement,
        sanity: ReferenceMeasurement.ReferenceSanity,
        widthMeasured: Boolean,
        footLandmarks: List<Point2D> = emptyList(),
        imageWidthPx: Int = 0,
        imageHeightPx: Int = 0,
        disagreement: LandmarkDisagreement.Report? = null,
    ): ValidationResult {
        if (!sanity.ok) {
            return ValidationResult(false, sanity.issue ?: "Reference calibration failed quality checks.")
        }
        if (!widthMeasured || measurement.widthMm <= 0.0) {
            return ValidationResult(false, "Width must be measured from both ball landmarks.")
        }
        if (measurement.confidence < Constants.LOW_CONFIDENCE_THRESHOLD) {
            return ValidationResult(
                false,
                "Measurement confidence is too low (${(measurement.confidence * 100).toInt()}%). Adjust landmarks and try again.",
            )
        }
        if (measurement.lengthMm < 120.0 || measurement.lengthMm > 360.0) {
            return ValidationResult(false, "Foot length is outside plausible human range.")
        }
        if (measurement.widthMm < 45.0 || measurement.widthMm > 160.0) {
            return ValidationResult(false, "Foot width is outside plausible human range.")
        }
        if (disagreement != null && !disagreement.ok) {
            return ValidationResult(false, disagreement.issue)
        }
        if (footLandmarks.isNotEmpty() && imageWidthPx > 0 && imageHeightPx > 0) {
            if (!landmarksHaveFrameMargin(footLandmarks, imageWidthPx, imageHeightPx)) {
                return ValidationResult(
                    false,
                    "Foot landmarks touch the frame edge — the full foot may be clipped. Retake with the whole foot visible.",
                )
            }
        }
        return ValidationResult(true, null)
    }

    private fun landmarksHaveFrameMargin(
        landmarks: List<Point2D>,
        widthPx: Int,
        heightPx: Int,
    ): Boolean {
        val margin = maxOf(6.0, minOf(widthPx, heightPx) * 0.02)
        return landmarks.all {
            it.x >= margin && it.y >= margin && it.x <= widthPx - margin && it.y <= heightPx - margin
        }
    }
}
