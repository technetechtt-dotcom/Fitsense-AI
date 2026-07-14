package com.fitsense.ai.ar

import com.fitsense.ai.measurement.CalibrationEngine
import com.google.ar.core.Session
import javax.inject.Inject

/**
 * Bridges ARCore camera intrinsics + plane distance into a px-per-mm
 * calibration suitable for [com.fitsense.ai.measurement.MeasurementEngine].
 */
class ArMeasurementHelper @Inject constructor(
    private val calibrationEngine: CalibrationEngine,
) {

    /**
     * Build a calibration from the current ARCore session.
     * @return null if the session has no valid frame yet, or if tracking is poor.
     */
    fun buildCalibration(session: Session, planeDistanceMeters: Float): CalibrationEngine.Calibration? {
        val frame = runCatching { session.update() }.getOrNull() ?: return null
        val intrinsics = frame.camera.imageIntrinsics
        // intrinsics.focalLength returns float[2] = fx, fy in pixels.
        val focalPx = intrinsics.focalLength
        if (focalPx.isEmpty()) return null
        val fxPx = focalPx[0].toDouble()

        return calibrationEngine.fromArCore(
            focalLengthPx = fxPx,
            planeDistanceMeters = planeDistanceMeters.toDouble(),
        )
    }
}
