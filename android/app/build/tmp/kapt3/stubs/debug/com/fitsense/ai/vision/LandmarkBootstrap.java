package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import com.fitsense.ai.measurement.Point2D;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.Foot;
import javax.inject.Inject;

/**
 * Seeds markup landmarks when auto-detection is uncertain.
 * Fallback points always set [LandmarkSource.FALLBACK] so the UI can require
 * explicit confirmation before millimetres are accepted.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000B\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0003\u0018\u00002\u00020\u0001:\u0001\u0015B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u001e\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\f2\u0006\u0010\r\u001a\u00020\u000eJ\u001e\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00110\u00102\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u0013H\u0002R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0016"}, d2 = {"Lcom/fitsense/ai/vision/LandmarkBootstrap;", "", "referenceDetector", "Lcom/fitsense/ai/vision/ReferenceDetector;", "contourDetector", "Lcom/fitsense/ai/vision/FootContourDetector;", "(Lcom/fitsense/ai/vision/ReferenceDetector;Lcom/fitsense/ai/vision/FootContourDetector;)V", "bootstrap", "Lcom/fitsense/ai/vision/LandmarkBootstrap$Bootstrap;", "bitmap", "Landroid/graphics/Bitmap;", "foot", "Lcom/fitsense/ai/models/Foot;", "calibration", "Lcom/fitsense/ai/models/CalibrationReference;", "defaultReferenceQuad", "", "Lcom/fitsense/ai/measurement/Point2D;", "w", "", "h", "Bootstrap", "app_debug"})
public final class LandmarkBootstrap {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.ReferenceDetector referenceDetector = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.FootContourDetector contourDetector = null;
    
    @javax.inject.Inject()
    public LandmarkBootstrap(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ReferenceDetector referenceDetector, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.FootContourDetector contourDetector) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.LandmarkBootstrap.Bootstrap bootstrap(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.Foot foot, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference calibration) {
        return null;
    }
    
    private final java.util.List<com.fitsense.ai.measurement.Point2D> defaultReferenceQuad(double w, double h) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000:\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0012\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001BM\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0004\u0012\u0006\u0010\u0006\u001a\u00020\u0004\u0012\u0006\u0010\u0007\u001a\u00020\u0004\u0012\u0006\u0010\b\u001a\u00020\u0004\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\n\u0012\b\u0010\f\u001a\u0004\u0018\u00010\r\u00a2\u0006\u0002\u0010\u000eJ\u000f\u0010 \u001a\b\u0012\u0004\u0012\u00020\u00040\u0003H\u00c6\u0003J\t\u0010!\u001a\u00020\u0004H\u00c6\u0003J\t\u0010\"\u001a\u00020\u0004H\u00c6\u0003J\t\u0010#\u001a\u00020\u0004H\u00c6\u0003J\t\u0010$\u001a\u00020\u0004H\u00c6\u0003J\t\u0010%\u001a\u00020\nH\u00c6\u0003J\t\u0010&\u001a\u00020\nH\u00c6\u0003J\u0010\u0010\'\u001a\u0004\u0018\u00010\rH\u00c6\u0003\u00a2\u0006\u0002\u0010\u0014Jf\u0010(\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00042\b\b\u0002\u0010\u0006\u001a\u00020\u00042\b\b\u0002\u0010\u0007\u001a\u00020\u00042\b\b\u0002\u0010\b\u001a\u00020\u00042\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\n2\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\rH\u00c6\u0001\u00a2\u0006\u0002\u0010)J\u0013\u0010*\u001a\u00020\u001a2\b\u0010+\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010,\u001a\u00020-H\u00d6\u0001J\t\u0010.\u001a\u00020/H\u00d6\u0001R\u0011\u0010\u000b\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0005\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0015\u0010\f\u001a\u0004\u0018\u00010\r\u00a2\u0006\n\n\u0002\u0010\u0015\u001a\u0004\b\u0013\u0010\u0014R\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0010R\u0011\u0010\u0019\u001a\u00020\u001a8F\u00a2\u0006\u0006\u001a\u0004\b\u001b\u0010\u001cR\u0011\u0010\u0006\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u0012R\u0011\u0010\b\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u0012R\u0011\u0010\u0007\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010\u0012\u00a8\u00060"}, d2 = {"Lcom/fitsense/ai/vision/LandmarkBootstrap$Bootstrap;", "", "refCorners", "", "Lcom/fitsense/ai/measurement/Point2D;", "heel", "toe", "widthMedial", "widthLateral", "refSource", "Lcom/fitsense/ai/vision/LandmarkSource;", "footSource", "refConfidence", "", "(Ljava/util/List;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/vision/LandmarkSource;Lcom/fitsense/ai/vision/LandmarkSource;Ljava/lang/Double;)V", "getFootSource", "()Lcom/fitsense/ai/vision/LandmarkSource;", "getHeel", "()Lcom/fitsense/ai/measurement/Point2D;", "getRefConfidence", "()Ljava/lang/Double;", "Ljava/lang/Double;", "getRefCorners", "()Ljava/util/List;", "getRefSource", "requiresFallbackConfirmation", "", "getRequiresFallbackConfirmation", "()Z", "getToe", "getWidthLateral", "getWidthMedial", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "copy", "(Ljava/util/List;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/vision/LandmarkSource;Lcom/fitsense/ai/vision/LandmarkSource;Ljava/lang/Double;)Lcom/fitsense/ai/vision/LandmarkBootstrap$Bootstrap;", "equals", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class Bootstrap {
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<com.fitsense.ai.measurement.Point2D> refCorners = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D heel = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D toe = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D widthMedial = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D widthLateral = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.vision.LandmarkSource refSource = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.vision.LandmarkSource footSource = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Double refConfidence = null;
        
        public Bootstrap(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource refSource, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource footSource, @org.jetbrains.annotations.Nullable()
        java.lang.Double refConfidence) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> getRefCorners() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getHeel() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getToe() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getWidthMedial() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getWidthLateral() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource getRefSource() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource getFootSource() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double getRefConfidence() {
            return null;
        }
        
        public final boolean getRequiresFallbackConfirmation() {
            return false;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component4() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource component6() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource component7() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double component8() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkBootstrap.Bootstrap copy(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource refSource, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource footSource, @org.jetbrains.annotations.Nullable()
        java.lang.Double refConfidence) {
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