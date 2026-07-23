package com.fitsense.ai.camera;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.graphics.YuvImage;
import androidx.camera.core.ImageProxy;
import com.fitsense.ai.vision.FootContourDetector;
import kotlinx.coroutines.flow.StateFlow;
import java.io.ByteArrayOutputStream;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Analyzer used by CameraX's [androidx.camera.core.ImageAnalysis] to surface a
 * lightweight, downsampled bitmap + an OpenCV-detected foot contour to the UI
 * for the real-time overlay.
 *
 * We run at most once per [throttleNs] to keep mid-range devices smooth.
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000>\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001:\u0001\u0015B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u000e\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u0012J\u000e\u0010\u0013\u001a\u0004\u0018\u00010\u0014*\u00020\u0012H\u0002R\u0016\u0010\u0005\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0019\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u000e\u0010\u000e\u001a\u00020\tX\u0082D\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0016"}, d2 = {"Lcom/fitsense/ai/camera/FootImageAnalyzer;", "", "contourDetector", "Lcom/fitsense/ai/vision/FootContourDetector;", "(Lcom/fitsense/ai/vision/FootContourDetector;)V", "_latest", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/fitsense/ai/camera/FootImageAnalyzer$AnalysisFrame;", "lastRunNs", "", "latest", "Lkotlinx/coroutines/flow/StateFlow;", "getLatest", "()Lkotlinx/coroutines/flow/StateFlow;", "throttleNs", "analyze", "", "image", "Landroidx/camera/core/ImageProxy;", "toBitmap720", "Landroid/graphics/Bitmap;", "AnalysisFrame", "app_debug"})
public final class FootImageAnalyzer {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.FootContourDetector contourDetector = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.fitsense.ai.camera.FootImageAnalyzer.AnalysisFrame> _latest = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.camera.FootImageAnalyzer.AnalysisFrame> latest = null;
    private long lastRunNs = 0L;
    private final long throttleNs = 100000000L;
    
    @javax.inject.Inject()
    public FootImageAnalyzer(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.FootContourDetector contourDetector) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.camera.FootImageAnalyzer.AnalysisFrame> getLatest() {
        return null;
    }
    
    public final void analyze(@org.jetbrains.annotations.NotNull()
    androidx.camera.core.ImageProxy image) {
    }
    
    private final android.graphics.Bitmap toBitmap720(androidx.camera.core.ImageProxy $this$toBitmap720) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u000e\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B)\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\b\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u0012\b\b\u0002\u0010\u0007\u001a\u00020\b\u00a2\u0006\u0002\u0010\tJ\t\u0010\u0011\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0012\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010\u0013\u001a\u0004\u0018\u00010\u0006H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\bH\u00c6\u0003J3\u0010\u0015\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\n\b\u0002\u0010\u0005\u001a\u0004\u0018\u00010\u00062\b\b\u0002\u0010\u0007\u001a\u00020\bH\u00c6\u0001J\u0013\u0010\u0016\u001a\u00020\u00172\b\u0010\u0018\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0019\u001a\u00020\u0003H\u00d6\u0001J\t\u0010\u001a\u001a\u00020\u001bH\u00d6\u0001R\u0013\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\r\u00a8\u0006\u001c"}, d2 = {"Lcom/fitsense/ai/camera/FootImageAnalyzer$AnalysisFrame;", "", "widthPx", "", "heightPx", "contour", "Lcom/fitsense/ai/vision/FootContourDetector$FootContour;", "ts", "", "(IILcom/fitsense/ai/vision/FootContourDetector$FootContour;J)V", "getContour", "()Lcom/fitsense/ai/vision/FootContourDetector$FootContour;", "getHeightPx", "()I", "getTs", "()J", "getWidthPx", "component1", "component2", "component3", "component4", "copy", "equals", "", "other", "hashCode", "toString", "", "app_debug"})
    public static final class AnalysisFrame {
        private final int widthPx = 0;
        private final int heightPx = 0;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.vision.FootContourDetector.FootContour contour = null;
        private final long ts = 0L;
        
        public AnalysisFrame(int widthPx, int heightPx, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.vision.FootContourDetector.FootContour contour, long ts) {
            super();
        }
        
        public final int getWidthPx() {
            return 0;
        }
        
        public final int getHeightPx() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.vision.FootContourDetector.FootContour getContour() {
            return null;
        }
        
        public final long getTs() {
            return 0L;
        }
        
        public final int component1() {
            return 0;
        }
        
        public final int component2() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.vision.FootContourDetector.FootContour component3() {
            return null;
        }
        
        public final long component4() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.camera.FootImageAnalyzer.AnalysisFrame copy(int widthPx, int heightPx, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.vision.FootContourDetector.FootContour contour, long ts) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
}