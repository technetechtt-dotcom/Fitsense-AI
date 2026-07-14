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
    val preferredBrands: List<String> = emptyList(),
)

enum class MeasurementUnit { MILLIMETRES, INCHES }
