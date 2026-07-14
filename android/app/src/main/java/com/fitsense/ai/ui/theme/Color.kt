package com.fitsense.ai.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * FitSense AI brand palette.
 *
 * Dark theme is treated as the primary aesthetic (sneaker-tech, near-black
 * surfaces with neon accents); the light theme is a tuned counterpart for
 * accessibility / daylight readability.
 */
object FitSenseColors {

    // Brand
    val Neon = Color(0xFF00E5C7)
    val Lime = Color(0xFFB8FF5C)
    val Violet = Color(0xFF7C4DFF)
    val Coral = Color(0xFFFF6B6B)

    // Dark neutrals
    val Surface0 = Color(0xFF0A0F1C)
    val Surface1 = Color(0xFF10162A)
    val Surface2 = Color(0xFF161D33)
    val Surface3 = Color(0xFF1F2740)
    val OnSurface = Color(0xFFE8ECF7)
    val OnSurfaceMuted = Color(0xFF8B93AE)

    // Light neutrals
    val Surface0Light = Color(0xFFF7F8FC)
    val Surface1Light = Color(0xFFFFFFFF)
    val Surface2Light = Color(0xFFEEF0F8)
    val OnSurfaceLight = Color(0xFF0E1322)
    val OnSurfaceMutedLight = Color(0xFF555E78)

    val ScanGradient: Brush get() = Brush.linearGradient(
        listOf(Neon.copy(alpha = 0.95f), Violet.copy(alpha = 0.85f)),
    )

    val HeroGradient: Brush get() = Brush.linearGradient(
        listOf(Surface1, Surface3),
    )
}
