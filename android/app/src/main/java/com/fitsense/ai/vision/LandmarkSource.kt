package com.fitsense.ai.vision

enum class LandmarkSource {
    /** CV detected with acceptable confidence. */
    DETECTED,
    /** Geometric / frame-fraction fallback — requires explicit user confirmation. */
    FALLBACK,
    /** User tapped or dragged to set the point. */
    MANUAL,
}
