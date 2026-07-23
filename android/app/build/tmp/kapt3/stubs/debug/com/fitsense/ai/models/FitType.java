package com.fitsense.ai.models;

import kotlinx.serialization.Serializable;

/**
 * Width / volume profile of a last (shoe shape).
 *
 * Used in combination with the user's [FootMeasurement.widthToLengthRatio] to
 * compute the fit score.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0000\n\u0002\u0010\u0006\n\u0002\b\b\b\u0086\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\u000f\b\u0002\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006j\u0002\b\u0007j\u0002\b\bj\u0002\b\tj\u0002\b\n\u00a8\u0006\u000b"}, d2 = {"Lcom/fitsense/ai/models/FitType;", "", "widthToLengthRatio", "", "(Ljava/lang/String;ID)V", "getWidthToLengthRatio", "()D", "NARROW", "STANDARD", "WIDE", "EXTRA_WIDE", "app_debug"})
public enum FitType {
    /*public static final*/ NARROW /* = new NARROW(0.0) */,
    /*public static final*/ STANDARD /* = new STANDARD(0.0) */,
    /*public static final*/ WIDE /* = new WIDE(0.0) */,
    /*public static final*/ EXTRA_WIDE /* = new EXTRA_WIDE(0.0) */;
    private final double widthToLengthRatio = 0.0;
    
    FitType(double widthToLengthRatio) {
    }
    
    public final double getWidthToLengthRatio() {
        return 0.0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public static kotlin.enums.EnumEntries<com.fitsense.ai.models.FitType> getEntries() {
        return null;
    }
}