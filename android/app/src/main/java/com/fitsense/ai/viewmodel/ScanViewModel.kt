package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.ar.ArCoreSessionManager
import com.fitsense.ai.ar.PlaneDetectionState
import com.fitsense.ai.models.CalibrationReference
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Drives the AR foot-scan flow:
 *  • Observes [ArCoreSessionManager] for plane state
 *  • Lets the user pick a calibration mode
 *  • Refuses to persist until a calibrated CameraX/OpenCV result is supplied.
 *
 * Pure-state class — Compose owns the UI lifecycle (CameraX preview, AR start).
 */
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val arSessionManager: ArCoreSessionManager,
) : ViewModel() {

    data class UiState(
        val planeState: PlaneDetectionState = PlaneDetectionState.Idle,
        val calibration: CalibrationReference = CalibrationReference.ARCORE_PLANE,
        val capturing: Boolean = false,
        val captureProgress: Float = 0f,
        val errorMessage: String? = null,
        val savedScanId: String? = null,
    )

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    val planeState: StateFlow<PlaneDetectionState> = arSessionManager.planeDetectionState

    init {
        viewModelScope.launch {
            arSessionManager.planeDetectionState.collect { state ->
                _uiState.update { it.copy(planeState = state) }
            }
        }
    }

    fun setCalibration(reference: CalibrationReference) {
        _uiState.update { it.copy(calibration = reference) }
    }

    /** Production refuses capture until CameraX has supplied real calibrated data. */
    fun captureScan(@Suppress("UNUSED_PARAMETER") onComplete: (String) -> Unit) {
        _uiState.update {
            it.copy(
                capturing = false,
                captureProgress = 0f,
                errorMessage = "Android measurement is not yet calibrated. No result was created or saved.",
            )
        }
    }

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun onArCoreUnavailable() {
        _uiState.update {
            it.copy(
                planeState = PlaneDetectionState.Error("ARCore unavailable"),
                calibration = CalibrationReference.A4_PAPER,
            )
        }
    }
}
