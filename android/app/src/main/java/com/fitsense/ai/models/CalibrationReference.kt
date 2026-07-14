package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * Known real-world reference objects we can detect in-frame to derive a
 * pixels-to-millimetres scale factor.
 *
 * ARCore-based plane scaling is always preferred when available; the reference
 * cards are deterministic fallbacks for non-AR devices.
 */
@Serializable
enum class CalibrationReference(
    val displayName: String,
    val widthMm: Double,
    val heightMm: Double,
) {
    A4_PAPER("A4 paper", widthMm = 210.0, heightMm = 297.0),
    CREDIT_CARD("Bank card (ID-1)", widthMm = 85.60, heightMm = 53.98),
    ARCORE_PLANE("AR plane (auto)", widthMm = 0.0, heightMm = 0.0);

    val aspectRatio: Double get() = if (heightMm == 0.0) 1.0 else widthMm / heightMm
}
