package com.fitsense.ai.viewmodel

import android.graphics.Bitmap
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.accuracy.AccuracyDatasetStore
import com.fitsense.ai.camera.CameraXController
import com.fitsense.ai.measurement.LandmarkDisagreement
import com.fitsense.ai.measurement.MeasurementValidator
import com.fitsense.ai.measurement.CalibrationEngine
import com.fitsense.ai.measurement.MeasurementEngine
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.measurement.distance
import com.fitsense.ai.measurement.sortCornersTopLeft
import com.fitsense.ai.measurement.ReferenceMeasurement
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.recommendation.RecommendationEngine
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.vision.ImageOrientation
import com.fitsense.ai.vision.ImageQualityProbe
import com.fitsense.ai.vision.LandmarkBootstrap
import com.fitsense.ai.vision.LandmarkSource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class ScanViewModel @Inject constructor(
    private val cameraController: CameraXController,
    private val imageOrientation: ImageOrientation,
    private val imageQualityProbe: ImageQualityProbe,
    private val landmarkBootstrap: LandmarkBootstrap,
    private val referenceMeasurement: ReferenceMeasurement,
    private val calibrationEngine: CalibrationEngine,
    private val measurementEngine: MeasurementEngine,
    private val measurementValidator: MeasurementValidator,
    private val scanRepository: ScanRepository,
    private val userRepository: UserRepository,
    private val recommendationEngine: RecommendationEngine,
    private val accuracyDatasetStore: AccuracyDatasetStore,
    private val cloudSyncCoordinator: com.fitsense.ai.sync.CloudSyncCoordinator,
) : ViewModel() {

    enum class ScanPhase { Camera, Markup, Review }

    enum class LandmarkKind {
        RefCorner0, RefCorner1, RefCorner2, RefCorner3,
        Heel, Toe, WidthMedial, WidthLateral,
    }

    data class MarkupState(
        val imageWidth: Int,
        val imageHeight: Int,
        val refCorners: List<Point2D>,
        val heel: Point2D,
        val toe: Point2D,
        val widthMedial: Point2D,
        val widthLateral: Point2D,
        val activeFoot: Foot,
        val selectedLandmark: LandmarkKind? = LandmarkKind.RefCorner0,
        val previewLengthMm: Double? = null,
        val previewWidthMm: Double? = null,
        val previewConfidence: Float? = null,
        val confidenceNotes: List<String> = emptyList(),
        val refSource: com.fitsense.ai.vision.LandmarkSource =
            com.fitsense.ai.vision.LandmarkSource.DETECTED,
        val footSource: com.fitsense.ai.vision.LandmarkSource =
            com.fitsense.ai.vision.LandmarkSource.DETECTED,
        val requiresFallbackConfirmation: Boolean = false,
        val fallbackConfirmed: Boolean = false,
        /** Contour seed used for disagreement checks; null when foot was fallback. */
        val contourSeed: LandmarkDisagreement.ContourSeed? = null,
    )

    data class UiState(
        val phase: ScanPhase = ScanPhase.Camera,
        val calibration: CalibrationReference = CalibrationReference.A4_PAPER,
        val activeFoot: Foot = Foot.RIGHT,
        val capturing: Boolean = false,
        val captureProgress: Float = 0f,
        val markup: MarkupState? = null,
        val leftFoot: FootMeasurement? = null,
        val rightFoot: FootMeasurement? = null,
        val pendingMeasurement: FootMeasurement? = null,
        val errorMessage: String? = null,
        val savedScanId: String? = null,
        val statusMessage: String? = null,
    )

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private var capturedBitmap: Bitmap? = null
    private var markupBaseline: MarkupState? = null
    private val markupUndoStack = ArrayDeque<MarkupState>()

    val camera: CameraXController get() = cameraController

    fun setCalibration(reference: CalibrationReference) {
        if (reference == CalibrationReference.ARCORE_PLANE) {
            _uiState.update {
                it.copy(
                    calibration = CalibrationReference.A4_PAPER,
                    statusMessage = "AR plane mode is not calibrated on Android yet. Using A4/card reference.",
                )
            }
            return
        }
        _uiState.update { it.copy(calibration = reference, statusMessage = null) }
    }

    fun setActiveFoot(foot: Foot) {
        _uiState.update { it.copy(activeFoot = foot) }
    }

    fun captureScan(onComplete: (String) -> Unit) {
        if (_uiState.value.capturing) return
        if (_uiState.value.calibration == CalibrationReference.ARCORE_PLANE) {
            _uiState.update {
                it.copy(errorMessage = "Choose A4 paper or bank card calibration for real measurements.")
            }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(capturing = true, captureProgress = 0.2f, errorMessage = null) }
            runCatching {
                val jpeg = cameraController.captureStill()
                _uiState.update { it.copy(captureProgress = 0.5f) }
                val bitmap = imageOrientation.decodeUprightJpeg(jpeg)
                val quality = imageQualityProbe.probe(bitmap)
                if (!quality.ok) {
                    bitmap.recycle()
                    error(quality.issue ?: "Image quality check failed.")
                }
                _uiState.update { it.copy(captureProgress = 0.75f) }
                val boot = landmarkBootstrap.bootstrap(
                    bitmap,
                    _uiState.value.activeFoot,
                    _uiState.value.calibration,
                )
                capturedBitmap?.recycle()
                capturedBitmap = bitmap
                val contourSeed = if (boot.footSource == LandmarkSource.DETECTED) {
                    LandmarkDisagreement.ContourSeed(
                        heel = boot.heel,
                        toe = boot.toe,
                        widthMedial = boot.widthMedial,
                        widthLateral = boot.widthLateral,
                    )
                } else {
                    null
                }
                val status = if (boot.requiresFallbackConfirmation) {
                    "Auto-detect used fallback landmarks — confirm they look correct before accepting."
                } else {
                    "Drag each marker to the correct corner and foot point."
                }
                val markup = MarkupState(
                    imageWidth = bitmap.width,
                    imageHeight = bitmap.height,
                    refCorners = boot.refCorners,
                    heel = boot.heel,
                    toe = boot.toe,
                    widthMedial = boot.widthMedial,
                    widthLateral = boot.widthLateral,
                    activeFoot = _uiState.value.activeFoot,
                    refSource = boot.refSource,
                    footSource = boot.footSource,
                    requiresFallbackConfirmation = boot.requiresFallbackConfirmation,
                    fallbackConfirmed = false,
                    contourSeed = contourSeed,
                )
                markupBaseline = markup
                markupUndoStack.clear()
                _uiState.update {
                    it.copy(
                        capturing = false,
                        captureProgress = 1f,
                        phase = ScanPhase.Markup,
                        markup = markup,
                        statusMessage = status,
                    )
                }
            }.onFailure { err ->
                capturedBitmap?.recycle()
                capturedBitmap = null
                _uiState.update {
                    it.copy(
                        capturing = false,
                        captureProgress = 0f,
                        errorMessage = err.message ?: "Capture failed.",
                    )
                }
            }
        }
    }

    fun selectLandmark(kind: LandmarkKind) {
        _uiState.update { state ->
            state.copy(markup = state.markup?.copy(selectedLandmark = kind))
        }
    }

    fun moveLandmark(kind: LandmarkKind, point: Point2D) {
        _uiState.update { state ->
            val markup = state.markup ?: return@update state
            val updated = when (kind) {
                LandmarkKind.RefCorner0 -> markup.copy(refCorners = markup.refCorners.mapIndexed { i, p -> if (i == 0) point else p })
                LandmarkKind.RefCorner1 -> markup.copy(refCorners = markup.refCorners.mapIndexed { i, p -> if (i == 1) point else p })
                LandmarkKind.RefCorner2 -> markup.copy(refCorners = markup.refCorners.mapIndexed { i, p -> if (i == 2) point else p })
                LandmarkKind.RefCorner3 -> markup.copy(refCorners = markup.refCorners.mapIndexed { i, p -> if (i == 3) point else p })
                LandmarkKind.Heel -> markup.copy(heel = point)
                LandmarkKind.Toe -> markup.copy(toe = point)
                LandmarkKind.WidthMedial -> markup.copy(widthMedial = point)
                LandmarkKind.WidthLateral -> markup.copy(widthLateral = point)
            }
            state.copy(markup = updated)
        }
        refreshPreview()
    }

    /** Snapshot current markup once per drag gesture so Undo undoes one move. */
    fun beginLandmarkEdit() {
        val markup = _uiState.value.markup ?: return
        pushUndo(markup)
    }

    fun undoLandmarkEdit() {
        val previous = markupUndoStack.removeLastOrNull() ?: return
        _uiState.update { it.copy(markup = previous, errorMessage = null) }
        refreshPreview()
    }

    fun resetLandmarks() {
        val baseline = markupBaseline ?: return
        val current = _uiState.value.markup
        if (current != null) pushUndo(current)
        _uiState.update {
            it.copy(
                markup = baseline.copy(
                    selectedLandmark = current?.selectedLandmark ?: LandmarkKind.RefCorner0,
                    fallbackConfirmed = false,
                ),
                errorMessage = null,
                statusMessage = "Landmarks reset to auto-detect seeds.",
            )
        }
        refreshPreview()
    }

    private fun pushUndo(markup: MarkupState) {
        markupUndoStack.addLast(markup)
        while (markupUndoStack.size > 40) {
            markupUndoStack.removeFirst()
        }
    }

    fun refreshPreview() {
        val markup = _uiState.value.markup ?: return
        val result = runCatching {
            referenceMeasurement.measure(
                ReferenceMeasurement.TapPoints(
                    refCorners = markup.refCorners,
                    heel = markup.heel,
                    toe = markup.toe,
                    widthMedial = markup.widthMedial,
                    widthLateral = markup.widthLateral,
                    foot = markup.activeFoot,
                    imageWidthPx = markup.imageWidth,
                    imageHeightPx = markup.imageHeight,
                ),
                _uiState.value.calibration,
            )
        }.getOrNull() ?: return
        _uiState.update { state ->
            state.copy(
                markup = state.markup?.copy(
                    previewLengthMm = result.measurement.lengthMm,
                    previewWidthMm = result.measurement.widthMm,
                    previewConfidence = result.measurement.confidence,
                    confidenceNotes = result.confidenceNotes,
                ),
            )
        }
    }

    fun confirmFallbackLandmarks(confirmed: Boolean) {
        _uiState.update { state ->
            state.copy(markup = state.markup?.copy(fallbackConfirmed = confirmed))
        }
    }

    fun acceptMeasurement() {
        val markup = _uiState.value.markup ?: return
        if (markup.requiresFallbackConfirmation && !markup.fallbackConfirmed) {
            _uiState.update {
                it.copy(
                    errorMessage = "Confirm fallback landmarks before accepting millimetre results.",
                )
            }
            return
        }
        val result = runCatching {
            referenceMeasurement.measure(
                ReferenceMeasurement.TapPoints(
                    refCorners = markup.refCorners,
                    heel = markup.heel,
                    toe = markup.toe,
                    widthMedial = markup.widthMedial,
                    widthLateral = markup.widthLateral,
                    foot = markup.activeFoot,
                    imageWidthPx = markup.imageWidth,
                    imageHeightPx = markup.imageHeight,
                ),
                _uiState.value.calibration,
            )
        }.getOrElse {
            _uiState.update { s -> s.copy(errorMessage = it.message ?: "Measurement failed.") }
            return
        }
        val disagreement = markup.contourSeed?.let { seed ->
            LandmarkDisagreement.compare(
                seed = seed,
                heel = markup.heel,
                toe = markup.toe,
                widthMedial = markup.widthMedial,
                widthLateral = markup.widthLateral,
                pixelsPerMm = result.pixelsPerMm,
            )
        }
        val validation = measurementValidator.validate(
            measurement = result.measurement,
            sanity = result.sanity,
            widthMeasured = result.widthMeasured,
            footLandmarks = listOf(markup.heel, markup.toe, markup.widthMedial, markup.widthLateral),
            imageWidthPx = markup.imageWidth,
            imageHeightPx = markup.imageHeight,
            disagreement = disagreement,
        )
        if (!validation.accepted) {
            _uiState.update { it.copy(errorMessage = validation.issue) }
            return
        }
        val bitmap = capturedBitmap
        if (bitmap != null) {
            val ordered = sortCornersTopLeft(markup.refCorners)
            val cardWidth = distance(ordered[0], ordered[1])
            val cardHeight = distance(ordered[1], ordered[2])
            val cal = calibrationEngine.fromReferenceCard(cardWidth, cardHeight, _uiState.value.calibration)
            measurementEngine.measure(
                MeasurementEngine.MeasurementInput(bitmap, cal, markup.activeFoot),
            )
        }
        val foot = markup.activeFoot
        _uiState.update { state ->
            state.copy(
                pendingMeasurement = result.measurement,
                phase = ScanPhase.Review,
                errorMessage = null,
                leftFoot = if (foot == Foot.LEFT) result.measurement else state.leftFoot,
                rightFoot = if (foot == Foot.RIGHT) result.measurement else state.rightFoot,
                statusMessage = "Accepted ${foot.name.lowercase()} foot: " +
                    "${"%.1f".format(result.measurement.lengthMm)} mm × " +
                    "${"%.1f".format(result.measurement.widthMm)} mm",
            )
        }
        viewModelScope.launch {
            val prefs = when (val user = userRepository.ensureSignedIn()) {
                is DataResult.Success -> user.value.preferences
                is DataResult.Failure -> null
            }
            accuracyDatasetStore.append(
                AccuracyDatasetStore.AccuracyRecord(
                    recordedAtEpochMs = System.currentTimeMillis(),
                    deviceModel = Build.MODEL,
                    foot = foot,
                    calibration = _uiState.value.calibration,
                    measuredLengthMm = result.measurement.lengthMm,
                    measuredWidthMm = result.measurement.widthMm,
                    confidence = result.measurement.confidence,
                    groundTruthLengthMm = prefs?.groundTruthLengthMm,
                    groundTruthWidthMm = prefs?.groundTruthWidthMm,
                    notes = prefs?.accuracyStudyNotes,
                ),
            )
        }
    }

    fun scanOtherFoot() {
        capturedBitmap?.recycle()
        capturedBitmap = null
        markupBaseline = null
        markupUndoStack.clear()
        val nextFoot = if (_uiState.value.activeFoot == Foot.RIGHT) Foot.LEFT else Foot.RIGHT
        _uiState.update {
            it.copy(
                phase = ScanPhase.Camera,
                activeFoot = nextFoot,
                markup = null,
                pendingMeasurement = null,
                captureProgress = 0f,
                statusMessage = "Scan the ${nextFoot.name.lowercase()} foot on the same reference.",
            )
        }
    }

    fun saveAcceptedScan(onComplete: (String) -> Unit) {
        viewModelScope.launch {
            val state = _uiState.value
            val primary = state.rightFoot ?: state.leftFoot
            if (primary == null) {
                _uiState.update { it.copy(errorMessage = "No accepted measurement to save.") }
                return@launch
            }
            when (val user = userRepository.ensureSignedIn()) {
                is DataResult.Failure -> {
                    _uiState.update { it.copy(errorMessage = user.error.message) }
                    return@launch
                }
                is DataResult.Success -> {
                    val userId = user.value.userId
                    val scanId = UUID.randomUUID().toString()
                    val sizingFoot = listOfNotNull(state.leftFoot, state.rightFoot)
                        .maxByOrNull { it.lengthMm } ?: primary
                    val recommendation = recommendationEngine.recommend(sizingFoot)
                    val scan = ScanResult(
                        scanId = scanId,
                        userId = userId,
                        leftFoot = state.leftFoot,
                        rightFoot = state.rightFoot,
                        recommendation = recommendation,
                        deviceModel = Build.MODEL,
                        arcoreUsed = false,
                    )
                    when (val saved = scanRepository.saveScan(scan)) {
                        is DataResult.Failure -> {
                            _uiState.update { it.copy(errorMessage = saved.error.message) }
                        }
                        is DataResult.Success -> {
                            val cloudOk = cloudSyncCoordinator.enqueueScan(
                                scan,
                                user.value.preferences.cloudSyncOptIn,
                            )
                            _uiState.update {
                                it.copy(
                                    savedScanId = scanId,
                                    statusMessage = if (cloudOk) {
                                        "Scan saved and synced."
                                    } else if (user.value.preferences.cloudSyncOptIn) {
                                        "Scan saved locally; queued for cloud sync."
                                    } else {
                                        "Scan saved on device."
                                    },
                                )
                            }
                            onComplete(scanId)
                        }
                    }
                }
            }
        }
    }

    fun retake() {
        capturedBitmap?.recycle()
        capturedBitmap = null
        markupBaseline = null
        markupUndoStack.clear()
        _uiState.update {
            it.copy(
                phase = ScanPhase.Camera,
                markup = null,
                pendingMeasurement = null,
                captureProgress = 0f,
                errorMessage = null,
            )
        }
    }

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun currentBitmap(): Bitmap? = capturedBitmap

    override fun onCleared() {
        capturedBitmap?.recycle()
        cameraController.shutdown()
        super.onCleared()
    }
}
