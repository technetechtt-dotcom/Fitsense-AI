package com.fitsense.ai.ar;

import com.fitsense.ai.measurement.CalibrationEngine;
import com.google.ar.core.Session;
import javax.inject.Inject;

/**
 * Bridges ARCore camera intrinsics + plane distance into a px-per-mm
 * calibration suitable for [com.fitsense.ai.measurement.MeasurementEngine].
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0007\n\u0000\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0018\u0010\u0005\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\nR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u000b"}, d2 = {"Lcom/fitsense/ai/ar/ArMeasurementHelper;", "", "calibrationEngine", "Lcom/fitsense/ai/measurement/CalibrationEngine;", "(Lcom/fitsense/ai/measurement/CalibrationEngine;)V", "buildCalibration", "Lcom/fitsense/ai/measurement/CalibrationEngine$Calibration;", "session", "Lcom/google/ar/core/Session;", "planeDistanceMeters", "", "app_debug"})
public final class ArMeasurementHelper {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.CalibrationEngine calibrationEngine = null;
    
    @javax.inject.Inject()
    public ArMeasurementHelper(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.CalibrationEngine calibrationEngine) {
        super();
    }
    
    /**
     * Build a calibration from the current ARCore session.
     * @return null if the session has no valid frame yet, or if tracking is poor.
     */
    @org.jetbrains.annotations.Nullable()
    public final com.fitsense.ai.measurement.CalibrationEngine.Calibration buildCalibration(@org.jetbrains.annotations.NotNull()
    com.google.ar.core.Session session, float planeDistanceMeters) {
        return null;
    }
}