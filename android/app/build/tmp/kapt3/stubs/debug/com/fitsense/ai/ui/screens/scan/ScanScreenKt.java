package com.fitsense.ai.ui.screens.scan;

import android.Manifest;
import android.view.ViewGroup;
import androidx.camera.view.PreviewView;
import androidx.compose.foundation.layout.Arrangement;
import androidx.compose.material.icons.Icons;
import androidx.compose.material3.CardDefaults;
import androidx.compose.runtime.Composable;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import com.fitsense.ai.R;
import com.fitsense.ai.camera.CameraXController;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.Foot;
import com.fitsense.ai.ui.theme.FitSenseColors;
import com.fitsense.ai.viewmodel.ScanViewModel;
import com.google.accompanist.permissions.ExperimentalPermissionsApi;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000\\\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u000b\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\u001a$\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u0005H\u0003\u001a \u0010\u0006\u001a\u00020\u00012\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\fH\u0003\u001a\u0010\u0010\r\u001a\u00020\u00012\u0006\u0010\u000e\u001a\u00020\u000fH\u0003\u001a$\u0010\u0010\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00112\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0011\u0012\u0004\u0012\u00020\u00010\u0005H\u0003\u001aN\u0010\u0012\u001a\u00020\u00012\u0006\u0010\u0013\u001a\u00020\u00142\f\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\f\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\f\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\u0012\u0010\u0019\u001a\u000e\u0012\u0004\u0012\u00020\u001a\u0012\u0004\u0012\u00020\u00010\u0005H\u0003\u001a\u0016\u0010\u001b\u001a\u00020\u00012\f\u0010\u001c\u001a\b\u0012\u0004\u0012\u00020\u00010\u0016H\u0003\u001a:\u0010\u001d\u001a\u00020\u00012\u0006\u0010\u0013\u001a\u00020\u00142\f\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\f\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\f\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00010\u0016H\u0003\u001aT\u0010 \u001a\u00020\u00012\u0006\u0010\u0013\u001a\u00020\u00142\f\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162\u0012\u0010!\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00052\u0012\u0010\"\u001a\u000e\u0012\u0004\u0012\u00020\u0011\u0012\u0004\u0012\u00020\u00010\u00052\f\u0010#\u001a\b\u0012\u0004\u0012\u00020\u00010\u0016H\u0003\u001aC\u0010$\u001a\u00020\u00012\f\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00010\u00162!\u0010%\u001a\u001d\u0012\u0013\u0012\u00110\u000f\u00a2\u0006\f\b&\u0012\b\b\'\u0012\u0004\b\b((\u0012\u0004\u0012\u00020\u00010\u00052\b\b\u0002\u0010)\u001a\u00020*H\u0007\u00a8\u0006+"}, d2 = {"CalibrationSelector", "", "selected", "Lcom/fitsense/ai/models/CalibrationReference;", "onSelected", "Lkotlin/Function1;", "CameraLayer", "context", "Landroid/content/Context;", "lifecycleOwner", "Landroidx/lifecycle/LifecycleOwner;", "controller", "Lcom/fitsense/ai/camera/CameraXController;", "ErrorCard", "message", "", "FootSelector", "Lcom/fitsense/ai/models/Foot;", "MarkupControls", "state", "Lcom/fitsense/ai/viewmodel/ScanViewModel$UiState;", "onCancel", "Lkotlin/Function0;", "onAccept", "onRetake", "onConfirmFallback", "", "PermissionPrompt", "onRequest", "ReviewPanel", "onScanOtherFoot", "onSave", "ScanControls", "onCalibrationChange", "onFootChange", "onCapture", "ScanScreen", "onScanComplete", "Lkotlin/ParameterName;", "name", "scanId", "viewModel", "Lcom/fitsense/ai/viewmodel/ScanViewModel;", "app_debug"})
public final class ScanScreenKt {
    
    @kotlin.OptIn(markerClass = {com.google.accompanist.permissions.ExperimentalPermissionsApi.class})
    @androidx.compose.runtime.Composable()
    public static final void ScanScreen(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onCancel, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onScanComplete, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.ScanViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void CameraLayer(android.content.Context context, androidx.lifecycle.LifecycleOwner lifecycleOwner, com.fitsense.ai.camera.CameraXController controller) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void ScanControls(com.fitsense.ai.viewmodel.ScanViewModel.UiState state, kotlin.jvm.functions.Function0<kotlin.Unit> onCancel, kotlin.jvm.functions.Function1<? super com.fitsense.ai.models.CalibrationReference, kotlin.Unit> onCalibrationChange, kotlin.jvm.functions.Function1<? super com.fitsense.ai.models.Foot, kotlin.Unit> onFootChange, kotlin.jvm.functions.Function0<kotlin.Unit> onCapture) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void MarkupControls(com.fitsense.ai.viewmodel.ScanViewModel.UiState state, kotlin.jvm.functions.Function0<kotlin.Unit> onCancel, kotlin.jvm.functions.Function0<kotlin.Unit> onAccept, kotlin.jvm.functions.Function0<kotlin.Unit> onRetake, kotlin.jvm.functions.Function1<? super java.lang.Boolean, kotlin.Unit> onConfirmFallback) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void ReviewPanel(com.fitsense.ai.viewmodel.ScanViewModel.UiState state, kotlin.jvm.functions.Function0<kotlin.Unit> onScanOtherFoot, kotlin.jvm.functions.Function0<kotlin.Unit> onSave, kotlin.jvm.functions.Function0<kotlin.Unit> onRetake) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void FootSelector(com.fitsense.ai.models.Foot selected, kotlin.jvm.functions.Function1<? super com.fitsense.ai.models.Foot, kotlin.Unit> onSelected) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void CalibrationSelector(com.fitsense.ai.models.CalibrationReference selected, kotlin.jvm.functions.Function1<? super com.fitsense.ai.models.CalibrationReference, kotlin.Unit> onSelected) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void ErrorCard(java.lang.String message) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void PermissionPrompt(kotlin.jvm.functions.Function0<kotlin.Unit> onRequest) {
    }
}