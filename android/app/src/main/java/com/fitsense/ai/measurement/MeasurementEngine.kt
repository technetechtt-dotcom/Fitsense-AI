package com.fitsense.ai.measurement

import android.graphics.Bitmap
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.vision.FootContourDetector
import javax.inject.Inject

/**
 * High-level orchestrator: takes a captured image + a calibration, produces
 * a [FootMeasurement] suitable for storage and recommendation.
 */
class MeasurementEngine @Inject constructor(
    private val contourDetector: FootContourDetector,
    private val calibrationEngine: CalibrationEngine,
    @Suppress("UnusedPrivateMember") private val unitConverter: UnitConverter,
) {

    data class MeasurementInput(
        val bitmap: Bitmap,
        val calibration: CalibrationEngine.Calibration,
        val foot: Foot = Foot.UNKNOWN,
    )

    /** Detect & measure a single foot. */
    fun measure(input: MeasurementInput): DataResult<FootMeasurement> {
        val contour = contourDetector.detect(input.bitmap)
            ?: return DataResult.Failure(
                AppError.Vision("No foot contour found in frame."),
            )

        val mmPerPx = 1.0 / input.calibration.pixelsPerMm
        val lengthMm = contour.lengthPx * mmPerPx
        val widthMm = contour.widthPx * mmPerPx

        // Blend the contour & calibration confidences so the UI reflects both.
        val combinedConfidence = (
            contour.confidence * 0.6f + input.calibration.confidence * 0.4f
        ).coerceIn(0f, 1f)

        return DataResult.Success(
            FootMeasurement(
                lengthMm = lengthMm,
                widthMm = widthMm,
                confidence = combinedConfidence,
                foot = input.foot,
                calibration = input.calibration.reference,
                pixelsPerMm = input.calibration.pixelsPerMm,
            ),
        )
    }

    /** Convenience: measure both feet given two frames + a shared calibration. */
    fun measurePair(
        left: Bitmap?,
        right: Bitmap?,
        calibration: CalibrationEngine.Calibration,
    ): Pair<FootMeasurement?, FootMeasurement?> {
        val l = left?.let { measure(MeasurementInput(it, calibration, Foot.LEFT)).getOrNull() }
        val r = right?.let { measure(MeasurementInput(it, calibration, Foot.RIGHT)).getOrNull() }
        return l to r
    }

    /**
     * Mock pathway used for offline demos / device emulators where ARCore + a
     * real foot contour aren't available.  Returns plausible numbers for the
     * demo flow so investors can see the full UX end-to-end.
     */
    fun simulatedMeasurement(
        seedMm: Double = 264.0,
        calibration: CalibrationReference = CalibrationReference.ARCORE_PLANE,
    ): FootMeasurement = FootMeasurement(
        lengthMm = seedMm,
        widthMm = seedMm * 0.39,
        confidence = 0.82f,
        foot = Foot.RIGHT,
        calibration = calibration,
        pixelsPerMm = 12.0,
    )
}
