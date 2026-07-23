package com.fitsense.ai.models;

import kotlinx.serialization.Serializable;

/**
 * Known real-world reference objects we can detect in-frame to derive a
 * pixels-to-millimetres scale factor.
 *
 * ARCore-based plane scaling is always preferred when available; the reference
 * cards are deterministic fallbacks for non-AR devices.
 */
@kotlinx.serialization.Serializable()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0018\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u000e\b\u0087\u0081\u0002\u0018\u0000 \u00122\b\u0012\u0004\u0012\u00020\u00000\u0001:\u0001\u0012B\u001f\b\u0002\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0007R\u0011\u0010\b\u001a\u00020\u00058F\u00a2\u0006\u0006\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\nR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\nj\u0002\b\u000fj\u0002\b\u0010j\u0002\b\u0011\u00a8\u0006\u0013"}, d2 = {"Lcom/fitsense/ai/models/CalibrationReference;", "", "displayName", "", "widthMm", "", "heightMm", "(Ljava/lang/String;ILjava/lang/String;DD)V", "aspectRatio", "getAspectRatio", "()D", "getDisplayName", "()Ljava/lang/String;", "getHeightMm", "getWidthMm", "A4_PAPER", "CREDIT_CARD", "ARCORE_PLANE", "Companion", "app_debug"})
public enum CalibrationReference {
    /*public static final*/ A4_PAPER /* = new A4_PAPER(null, 0.0, 0.0) */,
    /*public static final*/ CREDIT_CARD /* = new CREDIT_CARD(null, 0.0, 0.0) */,
    /*public static final*/ ARCORE_PLANE /* = new ARCORE_PLANE(null, 0.0, 0.0) */;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String displayName = null;
    private final double widthMm = 0.0;
    private final double heightMm = 0.0;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.models.CalibrationReference.Companion Companion = null;
    
    CalibrationReference(java.lang.String displayName, double widthMm, double heightMm) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getDisplayName() {
        return null;
    }
    
    public final double getWidthMm() {
        return 0.0;
    }
    
    public final double getHeightMm() {
        return 0.0;
    }
    
    public final double getAspectRatio() {
        return 0.0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public static kotlin.enums.EnumEntries<com.fitsense.ai.models.CalibrationReference> getEntries() {
        return null;
    }
    
    /**
     * Known real-world reference objects we can detect in-frame to derive a
     * pixels-to-millimetres scale factor.
     *
     * ARCore-based plane scaling is always preferred when available; the reference
     * cards are deterministic fallbacks for non-AR devices.
     */
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/models/CalibrationReference$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/models/CalibrationReference;", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final kotlinx.serialization.KSerializer<com.fitsense.ai.models.CalibrationReference> serializer() {
            return null;
        }
    }
}