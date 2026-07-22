package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * Authenticated FitSense user. Anonymous users still get a [UserProfile] with
 * [isAnonymous] = true so we have a stable id for scan history.
 */
@Serializable
data class UserProfile(
    val userId: String,
    val displayName: String? = null,
    val email: String? = null,
    val isAnonymous: Boolean = true,
    val preferences: UserPreferences = UserPreferences(),
    val cachedFootLengthMm: Double? = null,
    val cachedFootWidthMm: Double? = null,
    val createdAtEpochMs: Long = System.currentTimeMillis(),
    val updatedAtEpochMs: Long = System.currentTimeMillis(),
)

/** User-tunable defaults. */
@Serializable
data class UserPreferences(
    val units: MeasurementUnit = MeasurementUnit.MILLIMETRES,
    val defaultCalibration: CalibrationReference = CalibrationReference.A4_PAPER,
    val analyticsOptIn: Boolean = false,
    /** When true and API_BASE_URL is set, scans sync to FitSense cloud. */
    val cloudSyncOptIn: Boolean = false,
    val preferredBrands: List<String> = emptyList(),
    /** Optional Brannock / known-foot ground truth for accuracy study captures. */
    val groundTruthLengthMm: Double? = null,
    val groundTruthWidthMm: Double? = null,
    val accuracyStudyNotes: String? = null,
)

enum class MeasurementUnit { MILLIMETRES, INCHES }
