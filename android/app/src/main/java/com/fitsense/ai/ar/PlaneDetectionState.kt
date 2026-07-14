package com.fitsense.ai.ar

/**
 * Coarse state machine for AR plane detection. The scan screen renders a
 * different overlay for each value (searching, found, tracking, lost).
 */
sealed interface PlaneDetectionState {
    data object Idle : PlaneDetectionState
    data object Searching : PlaneDetectionState
    data class Found(val planeAreaM2: Float, val distanceMeters: Float) : PlaneDetectionState
    data object Lost : PlaneDetectionState
    data class Error(val reason: String) : PlaneDetectionState
}
