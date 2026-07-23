package com.fitsense.ai.measurement;

import com.fitsense.ai.models.MeasurementUnit;
import javax.inject.Inject;

/**
 * Converts mm <-> inches with a single decimal of precision for display.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0006\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\u0018\u0000 \f2\u00020\u0001:\u0001\fB\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u0016\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\bJ\u000e\u0010\t\u001a\u00020\u00062\u0006\u0010\n\u001a\u00020\u0006J\u000e\u0010\u000b\u001a\u00020\u00062\u0006\u0010\u0005\u001a\u00020\u0006\u00a8\u0006\r"}, d2 = {"Lcom/fitsense/ai/measurement/UnitConverter;", "", "()V", "format", "", "mm", "", "unit", "Lcom/fitsense/ai/models/MeasurementUnit;", "inchesToMm", "inches", "mmToInches", "Companion", "app_debug"})
public final class UnitConverter {
    @java.lang.Deprecated()
    public static final double MM_PER_INCH = 25.4;
    @org.jetbrains.annotations.NotNull()
    private static final com.fitsense.ai.measurement.UnitConverter.Companion Companion = null;
    
    @javax.inject.Inject()
    public UnitConverter() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String format(double mm, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.MeasurementUnit unit) {
        return null;
    }
    
    public final double mmToInches(double mm) {
        return 0.0;
    }
    
    public final double inchesToMm(double inches) {
        return 0.0;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0000\b\u0082\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0005"}, d2 = {"Lcom/fitsense/ai/measurement/UnitConverter$Companion;", "", "()V", "MM_PER_INCH", "", "app_debug"})
    static final class Companion {
        
        private Companion() {
            super();
        }
    }
}