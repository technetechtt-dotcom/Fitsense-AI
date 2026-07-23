package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import com.fitsense.ai.measurement.Point2D;
import com.fitsense.ai.models.CalibrationReference;
import org.opencv.imgproc.Imgproc;
import javax.inject.Inject;

/**
 * Locates a rectangular reference object (A4 / card). Returns null when
 * uncertain — never invents a default quad.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\u0018\u0000 \u00122\u00020\u0001:\u0002\u0012\u0013B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u001a\u0010\u0005\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u0007\u001a\u00020\b2\b\b\u0002\u0010\t\u001a\u00020\nJ&\u0010\u000b\u001a\u00020\f2\f\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000f0\u000e2\u0006\u0010\u0010\u001a\u00020\f2\u0006\u0010\u0011\u001a\u00020\fH\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0014"}, d2 = {"Lcom/fitsense/ai/vision/ReferenceDetector;", "", "preprocessor", "Lcom/fitsense/ai/vision/ImagePreprocessor;", "(Lcom/fitsense/ai/vision/ImagePreprocessor;)V", "detectCorners", "Lcom/fitsense/ai/vision/ReferenceDetector$Detection;", "bitmap", "Landroid/graphics/Bitmap;", "calibration", "Lcom/fitsense/ai/models/CalibrationReference;", "scoreQuad", "", "corners", "", "Lcom/fitsense/ai/measurement/Point2D;", "expectedAspect", "areaFraction", "Companion", "Detection", "app_debug"})
public final class ReferenceDetector {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.ImagePreprocessor preprocessor = null;
    private static final double MIN_AREA_FRACTION = 0.05;
    private static final double MAX_AREA_FRACTION = 0.85;
    private static final double MIN_CONFIDENCE = 0.6;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.vision.ReferenceDetector.Companion Companion = null;
    
    @javax.inject.Inject()
    public ReferenceDetector(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ImagePreprocessor preprocessor) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.fitsense.ai.vision.ReferenceDetector.Detection detectCorners(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference calibration) {
        return null;
    }
    
    private final double scoreQuad(java.util.List<com.fitsense.ai.measurement.Point2D> corners, double expectedAspect, double areaFraction) {
        return 0.0;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\u0003\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0007"}, d2 = {"Lcom/fitsense/ai/vision/ReferenceDetector$Companion;", "", "()V", "MAX_AREA_FRACTION", "", "MIN_AREA_FRACTION", "MIN_CONFIDENCE", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B#\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\u0006\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\u0002\u0010\bJ\u000f\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003H\u00c6\u0003J\t\u0010\u000f\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0006H\u00c6\u0003J-\u0010\u0011\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u0006H\u00c6\u0001J\u0013\u0010\u0012\u001a\u00020\u00132\b\u0010\u0014\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0015\u001a\u00020\u0016H\u00d6\u0001J\t\u0010\u0017\u001a\u00020\u0018H\u00d6\u0001R\u0011\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\nR\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\r\u00a8\u0006\u0019"}, d2 = {"Lcom/fitsense/ai/vision/ReferenceDetector$Detection;", "", "corners", "", "Lcom/fitsense/ai/measurement/Point2D;", "confidence", "", "areaPx", "(Ljava/util/List;DD)V", "getAreaPx", "()D", "getConfidence", "getCorners", "()Ljava/util/List;", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class Detection {
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<com.fitsense.ai.measurement.Point2D> corners = null;
        private final double confidence = 0.0;
        private final double areaPx = 0.0;
        
        public Detection(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> corners, double confidence, double areaPx) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> getCorners() {
            return null;
        }
        
        public final double getConfidence() {
            return 0.0;
        }
        
        public final double getAreaPx() {
            return 0.0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> component1() {
            return null;
        }
        
        public final double component2() {
            return 0.0;
        }
        
        public final double component3() {
            return 0.0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.ReferenceDetector.Detection copy(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> corners, double confidence, double areaPx) {
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