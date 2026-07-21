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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.R
import com.fitsense.ai.ar.PlaneDetectionState
import com.fitsense.ai.camera.CameraXController
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.ui.components.PrimaryButton
import com.fitsense.ai.ui.components.ScanGuideOverlay
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.ScanViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import kotlinx.coroutines.launch

/**
 * AR-assisted foot-scan screen.
 *
 * Mounts a CameraX [PreviewView] (camera feed) underneath an animated Compose
 * AR overlay.  The companion [ScanViewModel] drives:
 *   • plane detection state (label + colour)
 *   • capture progress
 *   • calibration mode selection (A4 / card / AR).
 *
 * ARCore session lifecycle is owned by the ViewModel; the screen only renders.
 */
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun ScanScreen(
    onCancel: () -> Unit,
    onScanComplete: (scanId: String) -> Unit,
    viewModel: ScanViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
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

            else -> {
                CameraLayer(context = context, lifecycleOwner = lifecycleOwner)
                ScanGuideOverlay(modifier = Modifier.fillMaxSize().padding(top = 100.dp, bottom = 200.dp))
                ScanControls(
                    state = uiState,
                    planeState = uiState.planeState,
                    onCancel = onCancel,
                    onCalibrationChange = viewModel::setCalibration,
                    onCapture = {
                        scope.launch {
                            viewModel.captureScan(onComplete = onScanComplete)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun CameraLayer(context: android.content.Context, lifecycleOwner: androidx.lifecycle.LifecycleOwner) {
    // CameraX preview lives inside an AndroidView — the bind/unbind is handled
    // via a DisposableEffect to avoid leaking the binding when the user backs out.
    val controller = remember { CameraXController() }

    val previewView = remember {
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

    AndroidView(
        factory = { previewView },
        modifier = Modifier.fillMaxSize(),
    )
}

@Composable
private fun ScanControls(
    state: ScanViewModel.UiState,
    planeState: PlaneDetectionState,
    onCancel: () -> Unit,
    onCalibrationChange: (CalibrationReference) -> Unit,
    onCapture: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // -- Top bar --------------------------------------------------------
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
                Icon(
                    imageVector = Icons.Rounded.Close,
                    contentDescription = stringResource(R.string.common_cancel),
                    tint = Color.White,
                )
            }
            Spacer(modifier = Modifier.weight(1f))
            StatusBadge(planeState = planeState)
            Spacer(modifier = Modifier.weight(1f))
            // Symmetric spacer to balance the close button.
            Spacer(modifier = Modifier.size(44.dp))
        }

        Spacer(modifier = Modifier.weight(1f))

        // -- Bottom controls ------------------------------------------------
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CalibrationSelector(selected = state.calibration, onSelected = onCalibrationChange)

            state.errorMessage?.let { message ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = FitSenseColors.Coral.copy(alpha = 0.18f),
                    ),
                ) {
                    Text(
                        text = message,
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }

            if (state.capturing) {
                LinearProgressIndicator(
                    progress = { state.captureProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(6.dp)),
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
private fun StatusBadge(planeState: PlaneDetectionState) {
    val (label, color) = when (planeState) {
        PlaneDetectionState.Idle -> stringResource(R.string.scan_status_searching) to FitSenseColors.OnSurfaceMuted
        PlaneDetectionState.Searching -> stringResource(R.string.scan_status_searching) to FitSenseColors.OnSurfaceMuted
        is PlaneDetectionState.Found -> stringResource(R.string.scan_status_ready) to FitSenseColors.Neon
        PlaneDetectionState.Lost -> stringResource(R.string.scan_status_place_foot) to FitSenseColors.Lime
        is PlaneDetectionState.Error -> stringResource(R.string.scan_error_no_arcore) to FitSenseColors.Coral
    }
    Card(
        shape = RoundedCornerShape(50),
        colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.55f)),
    ) {
        Text(
            text = label,
            color = color,
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        )
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
            CalibrationReference.ARCORE_PLANE to stringResource(R.string.scan_calibration_arcore),
            CalibrationReference.A4_PAPER to stringResource(R.string.scan_calibration_a4),
            CalibrationReference.CREDIT_CARD to stringResource(R.string.scan_calibration_card),
        ).forEach { (ref, label) ->
            val active = selected == ref
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (active) FitSenseColors.Neon else Color.Transparent,
                ),
                onClick = { onSelected(ref) },
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (active) FitSenseColors.Surface0 else FitSenseColors.OnSurface,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun PermissionPrompt(onRequest: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.scan_permission_required),
            style = MaterialTheme.typography.titleMedium,
            color = FitSenseColors.OnSurface,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        PrimaryButton(text = stringResource(R.string.scan_permission_request), onClick = onRequest)
    }
}
