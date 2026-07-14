package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * A persisted scan: one or both feet measurements plus the size recommendation
 * snapshot produced at scan time.
 *
 * Persisted in Firestore under `users/{uid}/scans/{scanId}`.
 */
@Serializable
data class ScanResult(
    val scanId: String,
    val userId: String,
    val createdAtEpochMs: Long = System.currentTimeMillis(),
    val leftFoot: FootMeasurement? = null,
    val rightFoot: FootMeasurement? = null,
    val recommendation: SizeRecommendation? = null,
    val thumbnailUrl: String? = null,
    val deviceModel: String? = null,
    val arcoreUsed: Boolean = false,
) {
    /** Returns the dominant foot (right > left) for size mapping. */
    val primaryFoot: FootMeasurement?
        get() = rightFoot ?: leftFoot

    val averageLengthMm: Double?
        get() = when {
            leftFoot != null && rightFoot != null ->
                (leftFoot.lengthMm + rightFoot.lengthMm) / 2.0
            else -> primaryFoot?.lengthMm
        }

    val averageWidthMm: Double?
        get() = when {
            leftFoot != null && rightFoot != null ->
                (leftFoot.widthMm + rightFoot.widthMm) / 2.0
            else -> primaryFoot?.widthMm
        }
}
