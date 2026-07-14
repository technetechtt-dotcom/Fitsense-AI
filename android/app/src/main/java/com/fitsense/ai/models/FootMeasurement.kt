package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * Geometric measurement of a single foot derived from a scan.
 *
 * Length & width are always stored in millimetres internally; the UI converts
 * to imperial via [com.fitsense.ai.measurement.UnitConverter] when displaying.
 */
@Serializable
data class FootMeasurement(
    val lengthMm: Double,
    val widthMm: Double,
    val archHeightMm: Double? = null,
    val confidence: Float = 0f,        // 0..1
    val foot: Foot = Foot.UNKNOWN,
    val calibration: CalibrationReference = CalibrationReference.ARCORE_PLANE,
    val pixelsPerMm: Double = 0.0,
) {
    /** Ratio commonly used for "wide foot" heuristics. */
    val widthToLengthRatio: Double get() = if (lengthMm == 0.0) 0.0 else widthMm / lengthMm

    /** True if [widthToLengthRatio] crosses the BuildConfig threshold. */
    val isWide: Boolean
        get() = widthToLengthRatio >= com.fitsense.ai.BuildConfig.WIDE_FOOT_RATIO_THRESHOLD
}

enum class Foot { LEFT, RIGHT, UNKNOWN }
