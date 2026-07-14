package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.ar.ArCoreSessionManager
import com.fitsense.ai.ar.PlaneDetectionState
import com.fitsense.ai.measurement.MeasurementEngine
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.recommendation.RecommendationEngine
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.utils.DataResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

/**
 * Drives the AR foot-scan flow:
 *  • Observes [ArCoreSessionManager] for plane state
 *  • Lets the user pick a calibration mode
 *  • Builds + persists a [ScanResult] when capture completes.
 *
 * Pure-state class — Compose owns the UI lifecycle (CameraX preview, AR start).
 */
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val arSessionManager: ArCoreSessionManager,
    private val measurementEngine: MeasurementEngine,
    private val recommendationEngine: RecommendationEngine,
    private val scanRepository: ScanRepository,
    private val userRepository: UserRepository,
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

    /**
     * Runs an end-to-end capture using the simulated-measurement path, which
     * keeps the screen flow demo-ready even when running on an emulator without
     * ARCore + OpenCV foot contours. The real pipeline (AR-driven calibration
     * + OpenCV contour detection) plugs in via [MeasurementEngine.measure].
     */
    fun captureScan(onComplete: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(capturing = true, captureProgress = 0f) }
            for (step in 1..5) {
                delay(120)
                _uiState.update { it.copy(captureProgress = step / 5f) }
            }

            val measurement: FootMeasurement = measurementEngine.simulatedMeasurement(
                seedMm = 261.0 + (Math.random() * 18 - 9),
                calibration = _uiState.value.calibration,
            )
            val recommendation = recommendationEngine.recommend(measurement)

            val user = userRepository.profile.firstOrNull()
                ?: when (val r = userRepository.ensureSignedIn()) {
                    is DataResult.Success -> r.value
                    else -> null
                }

            if (user == null) {
                _uiState.update { it.copy(capturing = false, errorMessage = "Not signed in.") }
                return@launch
            }

            val scanId = UUID.randomUUID().toString()
            val scan = ScanResult(
                scanId = scanId,
                userId = user.userId,
                rightFoot = measurement,
                recommendation = recommendation,
                arcoreUsed = _uiState.value.calibration == CalibrationReference.ARCORE_PLANE,
                deviceModel = android.os.Build.MODEL,
            )
            when (val r = scanRepository.saveScan(scan)) {
                is DataResult.Success -> {
                    userRepository.cacheLatestFootMetrics(measurement.lengthMm, measurement.widthMm)
                    _uiState.update { it.copy(capturing = false, savedScanId = r.value.scanId) }
                    onComplete(r.value.scanId)
                }
                is DataResult.Failure -> {
                    _uiState.update {
                        it.copy(capturing = false, errorMessage = r.error.message)
                    }
                }
            }
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
