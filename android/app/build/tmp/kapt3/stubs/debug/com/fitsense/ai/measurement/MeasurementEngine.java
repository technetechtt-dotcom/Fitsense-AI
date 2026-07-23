package com.fitsense.ai.measurement;

import android.graphics.Bitmap;
import com.fitsense.ai.models.Foot;
import com.fitsense.ai.models.FootMeasurement;
import com.fitsense.ai.utils.AppError;
import com.fitsense.ai.utils.DataResult;
import com.fitsense.ai.vision.FootContourDetector;
import javax.inject.Inject;

/**
 * High-level orchestrator: takes a captured image + a calibration, produces
 * a [FootMeasurement] suitable for storage and recommendation.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000D\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001:\u0001\u0015B\u001f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\u0014\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010\f\u001a\u00020\rJ2\u0010\u000e\u001a\u0012\u0012\u0006\u0012\u0004\u0018\u00010\u000b\u0012\u0006\u0012\u0004\u0018\u00010\u000b0\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u00112\b\u0010\u0012\u001a\u0004\u0018\u00010\u00112\u0006\u0010\u0013\u001a\u00020\u0014R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0016"}, d2 = {"Lcom/fitsense/ai/measurement/MeasurementEngine;", "", "contourDetector", "Lcom/fitsense/ai/vision/FootContourDetector;", "calibrationEngine", "Lcom/fitsense/ai/measurement/CalibrationEngine;", "unitConverter", "Lcom/fitsense/ai/measurement/UnitConverter;", "(Lcom/fitsense/ai/vision/FootContourDetector;Lcom/fitsense/ai/measurement/CalibrationEngine;Lcom/fitsense/ai/measurement/UnitConverter;)V", "measure", "Lcom/fitsense/ai/utils/DataResult;", "Lcom/fitsense/ai/models/FootMeasurement;", "input", "Lcom/fitsense/ai/measurement/MeasurementEngine$MeasurementInput;", "measurePair", "Lkotlin/Pair;", "left", "Landroid/graphics/Bitmap;", "right", "calibration", "Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "MeasurementInput", "app_debug"})
public final class MeasurementEngine {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.FootContourDetector contourDetector = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.CalibrationEngine calibrationEngine = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.UnitConverter unitConverter = null;
    
    @javax.inject.Inject()
    public MeasurementEngine(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.FootContourDetector contourDetector, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.CalibrationEngine calibrationEngine, @kotlin.Suppress(names = {"UnusedPrivateMember"})
    @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.UnitConverter unitConverter) {
        super();
    }
    
    /**
     * Detect & measure a single foot.
     */
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.utils.DataResult<com.fitsense.ai.models.FootMeasurement> measure(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.MeasurementEngine.MeasurementInput input) {
        return null;
    }
    
    /**
     * Convenience: measure both feet given two frames + a shared calibration.
     */
    @org.jetbrains.annotations.NotNull()
    public final kotlin.Pair<com.fitsense.ai.models.FootMeasurement, com.fitsense.ai.models.FootMeasurement> measurePair(@org.jetbrains.annotations.Nullable()
    android.graphics.Bitmap left, @org.jetbrains.annotations.Nullable()
    android.graphics.Bitmap right, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.CalibrationEngine.Calibration calibration) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B\u001f\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\b\b\u0002\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0007H\u00c6\u0003J\'\u0010\u0012\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0013\u001a\u00020\u00142\b\u0010\u0015\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0016\u001a\u00020\u0017H\u00d6\u0001J\t\u0010\u0018\u001a\u00020\u0019H\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000e\u00a8\u0006\u001a"}, d2 = {"Lcom/fitsense/ai/measurement/MeasurementEngine$MeasurementInput;", "", "bitmap", "Landroid/graphics/Bitmap;", "calibration", "Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "foot", "Lcom/fitsense/ai/models/Foot;", "(Landroid/graphics/Bitmap;Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;Lcom/fitsense/ai/models/Foot;)V", "getBitmap", "()Landroid/graphics/Bitmap;", "getCalibration", "()Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "getFoot", "()Lcom/fitsense/ai/models/Foot;", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class MeasurementInput {
        @org.jetbrains.annotations.NotNull()
        private final android.graphics.Bitmap bitmap = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.CalibrationEngine.Calibration calibration = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.Foot foot = null;
        
        public MeasurementInput(@org.jetbrains.annotations.NotNull()
        android.graphics.Bitmap bitmap, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.CalibrationEngine.Calibration calibration, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final android.graphics.Bitmap getBitmap() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.CalibrationEngine.Calibration getCalibration() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot getFoot() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final android.graphics.Bitmap component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.CalibrationEngine.Calibration component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.MeasurementEngine.MeasurementInput copy(@org.jetbrains.annotations.NotNull()
        android.graphics.Bitmap bitmap, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.CalibrationEngine.Calibration calibration, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot) {
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