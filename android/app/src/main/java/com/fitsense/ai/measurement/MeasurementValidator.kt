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
        return ValidationResult(true, null)
    }
}
