package com.fitsense.ai.measurement;

import com.fitsense.ai.models.CalibrationReference;
import javax.inject.Inject;

/**
 * Derives a pixels-per-millimetre scale factor that the measurement engine uses
 * to convert pixel distances into real-world millimetres.
 *
 * Two strategies:
 *  1. ARCore — the session reports the distance to the detected floor plane;
 *     combined with camera intrinsics, that yields a true world scale.
 *  2. Reference card (A4 / credit card) — we measure the known object in
 *     pixels and divide by its real-world dimensions.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001:\u0001\rB\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u0016\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u0006J\u001e\u0010\b\u001a\u00020\u00042\u0006\u0010\t\u001a\u00020\u00062\u0006\u0010\n\u001a\u00020\u00062\u0006\u0010\u000b\u001a\u00020\f\u00a8\u0006\u000e"}, d2 = {"Lcom/fitsense/ai/measurement/CalibrationEngine;", "", "()V", "fromArCore", "Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "focalLengthPx", "", "planeDistanceMeters", "fromReferenceCard", "cardWidthPx", "cardHeightPx", "reference", "Lcom/fitsense/ai/models/CalibrationReference;", "Calibration", "app_debug"})
public final class CalibrationEngine {
    
    @javax.inject.Inject()
    public CalibrationEngine() {
        super();
    }
    
    /**
     * Build calibration from a measured reference card bounding box.
     */
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.CalibrationEngine.Calibration fromReferenceCard(double cardWidthPx, double cardHeightPx, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference reference) {
        return null;
    }
    
    /**
     * Build calibration from an ARCore frame.
     *
     * @param focalLengthPx camera focal length in pixels (from camera intrinsics).
     * @param planeDistanceMeters distance from camera to the detected plane.
     * @return px/mm scale at the plane's depth.
     */
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.CalibrationEngine.Calibration fromArCore(double focalLengthPx, double planeDistanceMeters) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0006\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0007\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0007H\u00c6\u0003J\'\u0010\u0012\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0013\u001a\u00020\u00142\b\u0010\u0015\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0016\u001a\u00020\u0017H\u00d6\u0001J\t\u0010\u0018\u001a\u00020\u0019H\u00d6\u0001R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000e\u00a8\u0006\u001a"}, d2 = {"Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "", "pixelsPerMm", "", "reference", "Lcom/fitsense/ai/models/CalibrationReference;", "confidence", "", "(DLcom/fitsense/ai/models/CalibrationReference;F)V", "getConfidence", "()F", "getPixelsPerMm", "()D", "getReference", "()Lcom/fitsense/ai/models/CalibrationReference;", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class Calibration {
        private final double pixelsPerMm = 0.0;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.CalibrationReference reference = null;
        private final float confidence = 0.0F;
        
        public Calibration(double pixelsPerMm, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference reference, float confidence) {
            super();
        }
        
        public final double getPixelsPerMm() {
            return 0.0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference getReference() {
            return null;
        }
        
        public final float getConfidence() {
            return 0.0F;
        }
        
        public final double component1() {
            return 0.0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference component2() {
            return null;
        }
        
        public final float component3() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.CalibrationEngine.Calibration copy(double pixelsPerMm, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference reference, float confidence) {
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