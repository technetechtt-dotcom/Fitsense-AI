package com.fitsense.ai.ui.screens.scan;

import androidx.compose.runtime.Composable;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.drawscope.Stroke;
import androidx.compose.ui.layout.ContentScale;
import com.fitsense.ai.measurement.Point2D;
import com.fitsense.ai.ui.theme.FitSenseColors;
import com.fitsense.ai.viewmodel.ScanViewModel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000Z\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0003\u001aP\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00052\u0018\u0010\u0006\u001a\u0014\u0012\u0004\u0012\u00020\b\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u00072\u0012\u0010\n\u001a\u000e\u0012\u0004\u0012\u00020\b\u0012\u0004\u0012\u00020\u00010\u000b2\b\b\u0002\u0010\f\u001a\u00020\rH\u0007\u001a0\u0010\u000e\u001a\u00020\b2\u0006\u0010\u0004\u001a\u00020\u00052\u0006\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00102\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u0013H\u0002\u001a8\u0010\u0015\u001a\u00020\t2\u0006\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00102\u0006\u0010\u0016\u001a\u00020\u00132\u0006\u0010\u0017\u001a\u00020\u00132\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u0013H\u0002\u001a.\u0010\u0018\u001a\u00020\u0001*\u00020\u00192\u0006\u0010\u001a\u001a\u00020\u001b2\u0006\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u001fH\u0002\u00f8\u0001\u0000\u00a2\u0006\u0004\b \u0010!\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\""}, d2 = {"ScanMarkupOverlay", "", "bitmap", "Landroid/graphics/Bitmap;", "markup", "Lcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;", "onMoveLandmark", "Lkotlin/Function2;", "Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;", "Lcom/fitsense/ai/measurement/Point2D;", "onSelectLandmark", "Lkotlin/Function1;", "modifier", "Landroidx/compose/ui/Modifier;", "nearestLandmark", "x", "", "y", "viewW", "", "viewH", "screenToImage", "imageW", "imageH", "drawMarker", "Landroidx/compose/ui/graphics/drawscope/DrawScope;", "center", "Landroidx/compose/ui/geometry/Offset;", "color", "Landroidx/compose/ui/graphics/Color;", "selected", "", "drawMarker-hykp8_8", "(Landroidx/compose/ui/graphics/drawscope/DrawScope;JJZ)V", "app_debug"})
public final class ScanMarkupOverlayKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ScanMarkupOverlay(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.ScanViewModel.MarkupState markup, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function2<? super com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind, ? super com.fitsense.ai.measurement.Point2D, kotlin.Unit> onMoveLandmark, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind, kotlin.Unit> onSelectLandmark, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    private static final com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind nearestLandmark(com.fitsense.ai.viewmodel.ScanViewModel.MarkupState markup, float x, float y, int viewW, int viewH) {
        return null;
    }
    
    private static final com.fitsense.ai.measurement.Point2D screenToImage(float x, float y, int imageW, int imageH, int viewW, int viewH) {
        return null;
    }
}