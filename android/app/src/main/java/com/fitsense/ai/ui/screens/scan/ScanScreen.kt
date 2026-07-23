package com.fitsense.ai.ui.screens.scan

import android.Manifest
import android.view.ViewGroup
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.R
import com.fitsense.ai.camera.CameraXController
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.ui.components.PrimaryButton
import com.fitsense.ai.ui.components.ScanGuideOverlay
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.ScanViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import kotlinx.coroutines.launch

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun ScanScreen(
    onCancel: () -> Unit,
    onScanComplete: (scanId: String) -> Unit,
    viewModel: ScanViewModel = hiltViewModel(),
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val context = LocalContext.current
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)
    val uiState by viewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        if (!cameraPermission.status.isGranted) cameraPermission.launchPermissionRequest()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
    ) {
        when {
            !cameraPermission.status.isGranted ->
                PermissionPrompt(onRequest = { cameraPermission.launchPermissionRequest() })

            uiState.phase == ScanViewModel.ScanPhase.Markup && viewModel.currentBitmap() != null && uiState.markup != null -> {
                ScanMarkupOverlay(
                    bitmap = viewModel.currentBitmap()!!,
                    markup = uiState.markup!!,
                    onMoveLandmark = viewModel::moveLandmark,
                    onSelectLandmark = viewModel::selectLandmark,
                    onBeginEdit = viewModel::beginLandmarkEdit,
                    modifier = Modifier.fillMaxSize(),
                )
                MarkupControls(
                    state = uiState,
                    onAccept = viewModel::acceptMeasurement,
                    onRetake = viewModel::retake,
                    onUndo = viewModel::undoLandmarkEdit,
                    onReset = viewModel::resetLandmarks,
                    onConfirmFallback = viewModel::confirmFallbackLandmarks,
                )
            }

            uiState.phase == ScanViewModel.ScanPhase.Review -> {
                ReviewPanel(
                    state = uiState,
                    onScanOtherFoot = viewModel::scanOtherFoot,
                    onSave = { viewModel.saveAcceptedScan(onScanComplete) },
                    onRetake = viewModel::retake,
                )
            }

            else -> {
                CameraLayer(
                    context = context,
                    lifecycleOwner = lifecycleOwner,
                    controller = viewModel.camera,
                )
                ScanGuideOverlay(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(top = 100.dp, bottom = 240.dp),
                )
                ScanControls(
                    state = uiState,
                    onCancel = onCancel,
                    onCalibrationChange = viewModel::setCalibration,
                    onFootChange = viewModel::setActiveFoot,
                    onCapture = {
                        scope.launch { viewModel.captureScan(onComplete = onScanComplete) }
                    },
                )
            }
        }
    }
}

@Composable
private fun CameraLayer(
    context: android.content.Context,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    controller: CameraXController,
) {
    val previewView = androidx.compose.runtime.remember {
        PreviewView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    LaunchedEffect(previewView) {
        runCatching { controller.bind(context, lifecycleOwner, previewView) }
    }

    DisposableEffect(Unit) {
        onDispose { controller.unbind() }
    }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
}

@Composable
private fun ScanControls(
    state: ScanViewModel.UiState,
    onCancel: () -> Unit,
    onCalibrationChange: (CalibrationReference) -> Unit,
    onFootChange: (Foot) -> Unit,
    onCapture: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(
                onClick = onCancel,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.45f)),
            ) {
                Icon(Icons.Rounded.Close, stringResource(R.string.common_cancel), tint = Color.White)
            }
            Spacer(Modifier.weight(1f))
            Text(
                text = stringResource(R.string.scan_foot_label, state.activeFoot.name.lowercase()),
                color = Color.White,
                style = MaterialTheme.typography.labelLarge,
            )
            Spacer(Modifier.weight(1f))
            Spacer(Modifier.size(44.dp))
        }

        Spacer(Modifier.weight(1f))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            FootSelector(selected = state.activeFoot, onSelected = onFootChange)
            CalibrationSelector(selected = state.calibration, onSelected = onCalibrationChange)
            state.statusMessage?.let {
                Text(it, color = FitSenseColors.OnSurfaceMuted, style = MaterialTheme.typography.bodySmall)
            }
            state.errorMessage?.let { message ->
                ErrorCard(message)
            }
            if (state.capturing) {
                LinearProgressIndicator(
                    progress = { state.captureProgress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(6.dp)),
                    color = FitSenseColors.Neon,
                    trackColor = FitSenseColors.Surface3,
                )
            }
            PrimaryButton(
                text = stringResource(R.string.scan_capture),
                onClick = onCapture,
                enabled = !state.capturing,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun MarkupControls(
    state: ScanViewModel.UiState,
    onAccept: () -> Unit,
    onRetake: () -> Unit,
    onUndo: () -> Unit,
    onReset: () -> Unit,
    onConfirmFallback: (Boolean) -> Unit,
) {
    val markup = state.markup
    Column(
        modifier = Modifier
            .fillMaxSize()
            .navigationBarsPadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.Bottom,
    ) {
        state.statusMessage?.let {
            Text(
                text = it,
                style = MaterialTheme.typography.bodySmall,
                color = FitSenseColors.OnSurfaceMuted,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
        if (markup?.requiresFallbackConfirmation == true) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
            ) {
                Checkbox(
                    checked = markup.fallbackConfirmed,
                    onCheckedChange = onConfirmFallback,
                )
                Text(
                    text = "I confirm these fallback landmarks are correct",
                    style = MaterialTheme.typography.bodyMedium,
                    color = FitSenseColors.OnSurface,
                    modifier = Modifier.weight(1f),
                )
            }
        }
        state.errorMessage?.let { ErrorCard(it) }
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 8.dp),
        ) {
            PrimaryButton(
                text = stringResource(R.string.scan_undo_landmark),
                onClick = onUndo,
                modifier = Modifier.weight(1f),
            )
            PrimaryButton(
                text = stringResource(R.string.scan_reset_landmarks),
                onClick = onReset,
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PrimaryButton(
                text = stringResource(R.string.scan_retake),
                onClick = onRetake,
                modifier = Modifier.weight(1f),
            )
            PrimaryButton(
                text = stringResource(R.string.scan_accept_measurement),
                onClick = onAccept,
                enabled = markup == null ||
                    !markup.requiresFallbackConfirmation ||
                    markup.fallbackConfirmed,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun ReviewPanel(
    state: ScanViewModel.UiState,
    onScanOtherFoot: () -> Unit,
    onSave: () -> Unit,
    onRetake: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
    ) {
        Text(stringResource(R.string.scan_review_title), style = MaterialTheme.typography.headlineSmall)
        state.leftFoot?.let {
            Text("Left: ${"%.1f".format(it.lengthMm)} × ${"%.1f".format(it.widthMm)} mm")
        }
        state.rightFoot?.let {
            Text("Right: ${"%.1f".format(it.lengthMm)} × ${"%.1f".format(it.widthMm)} mm")
        }
        state.statusMessage?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
        if (state.leftFoot == null || state.rightFoot == null) {
            PrimaryButton(
                text = stringResource(R.string.scan_other_foot),
                onClick = onScanOtherFoot,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        PrimaryButton(text = stringResource(R.string.scan_save_measurement), onClick = onSave, modifier = Modifier.fillMaxWidth())
        PrimaryButton(text = stringResource(R.string.scan_retake), onClick = onRetake, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun FootSelector(selected: Foot, onSelected: (Foot) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(Foot.LEFT, Foot.RIGHT).forEach { foot ->
            val active = selected == foot
            Card(
                onClick = { onSelected(foot) },
                colors = CardDefaults.cardColors(containerColor = if (active) FitSenseColors.Neon else Color.Black.copy(0.45f)),
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    text = foot.name.lowercase().replaceFirstChar { it.titlecase() },
                    modifier = Modifier.padding(12.dp),
                    color = if (active) FitSenseColors.Surface0 else Color.White,
                )
            }
        }
    }
}

@Composable
private fun CalibrationSelector(
    selected: CalibrationReference,
    onSelected: (CalibrationReference) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.Black.copy(alpha = 0.55f))
            .padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        listOf(
            CalibrationReference.A4_PAPER to stringResource(R.string.scan_calibration_a4),
            CalibrationReference.CREDIT_CARD to stringResource(R.string.scan_calibration_card),
        ).forEach { (ref, label) ->
            val active = selected == ref
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = if (active) FitSenseColors.Neon else Color.Transparent),
                onClick = { onSelected(ref) },
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (active) FitSenseColors.Surface0 else FitSenseColors.OnSurface,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun ErrorCard(message: String) {
    Card(colors = CardDefaults.cardColors(containerColor = FitSenseColors.Coral.copy(alpha = 0.18f))) {
        Text(message, color = Color.White, modifier = Modifier.padding(12.dp))
    }
}

@Composable
private fun PermissionPrompt(onRequest: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            stringResource(R.string.scan_permission_required),
            style = MaterialTheme.typography.titleMedium,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        PrimaryButton(text = stringResource(R.string.scan_permission_request), onClick = onRequest)
    }
}
