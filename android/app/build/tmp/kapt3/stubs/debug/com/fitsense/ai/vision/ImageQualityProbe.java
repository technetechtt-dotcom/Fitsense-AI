package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import javax.inject.Inject;

/**
 * Cheap sharpness and luminance checks on a downscaled frame.
 * Mirrors the web `probeImageQuality` thresholds.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\u0018\u0000 \u00072\u00020\u0001:\u0002\u0007\bB\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006\u00a8\u0006\t"}, d2 = {"Lcom/fitsense/ai/vision/ImageQualityProbe;", "", "()V", "probe", "Lcom/fitsense/ai/vision/ImageQualityProbe$ImageQuality;", "bitmap", "Landroid/graphics/Bitmap;", "Companion", "ImageQuality", "app_debug"})
public final class ImageQualityProbe {
    private static final int MAX_PROBE_WIDTH = 320;
    private static final double SHARPNESS_FLOOR = 55.0;
    private static final double LUMINANCE_MIN = 35.0;
    private static final double LUMINANCE_MAX = 235.0;
    private static final double CLIPPED_FRACTION_MAX = 0.3;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.vision.ImageQualityProbe.Companion Companion = null;
    
    @javax.inject.Inject()
    public ImageQualityProbe() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.ImageQualityProbe.ImageQuality probe(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\n"}, d2 = {"Lcom/fitsense/ai/vision/ImageQualityProbe$Companion;", "", "()V", "CLIPPED_FRACTION_MAX", "", "LUMINANCE_MAX", "LUMINANCE_MIN", "MAX_PROBE_WIDTH", "", "SHARPNESS_FLOOR", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0004\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0014\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B7\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0003\u0012\u0006\u0010\u0006\u001a\u00020\u0003\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\b\u0010\t\u001a\u0004\u0018\u00010\n\u00a2\u0006\u0002\u0010\u000bJ\t\u0010\u0015\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0017\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0018\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\bH\u00c6\u0003J\u000b\u0010\u001a\u001a\u0004\u0018\u00010\nH\u00c6\u0003JG\u0010\u001b\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00032\b\b\u0002\u0010\u0006\u001a\u00020\u00032\b\b\u0002\u0010\u0007\u001a\u00020\b2\n\b\u0002\u0010\t\u001a\u0004\u0018\u00010\nH\u00c6\u0001J\u0013\u0010\u001c\u001a\u00020\b2\b\u0010\u001d\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001e\u001a\u00020\u001fH\u00d6\u0001J\t\u0010 \u001a\u00020\nH\u00d6\u0001R\u0011\u0010\u0006\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0013\u0010\t\u001a\u0004\u0018\u00010\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\rR\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\u0005\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\rR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\r\u00a8\u0006!"}, d2 = {"Lcom/fitsense/ai/vision/ImageQualityProbe$ImageQuality;", "", "sharpness", "", "meanLuminance", "shadowFraction", "highlightFraction", "ok", "", "issue", "", "(DDDDZLjava/lang/String;)V", "getHighlightFraction", "()D", "getIssue", "()Ljava/lang/String;", "getMeanLuminance", "getOk", "()Z", "getShadowFraction", "getSharpness", "component1", "component2", "component3", "component4", "component5", "component6", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
    public static final class ImageQuality {
        private final double sharpness = 0.0;
        private final double meanLuminance = 0.0;
        private final double shadowFraction = 0.0;
        private final double highlightFraction = 0.0;
        private final boolean ok = false;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String issue = null;
        
        public ImageQuality(double sharpness, double meanLuminance, double shadowFraction, double highlightFraction, boolean ok, @org.jetbrains.annotations.Nullable()
        java.lang.String issue) {
            super();
        }
        
        public final double getSharpness() {
            return 0.0;
        }
        
        public final double getMeanLuminance() {
            return 0.0;
        }
        
        public final double getShadowFraction() {
            return 0.0;
        }
        
        public final double getHighlightFraction() {
            return 0.0;
        }
        
        public final boolean getOk() {
            return false;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getIssue() {
            return null;
        }
        
        public final double component1() {
            return 0.0;
        }
        
        public final double component2() {
            return 0.0;
        }
        
        public final double component3() {
            return 0.0;
        }
        
        public final double component4() {
            return 0.0;
        }
        
        public final boolean component5() {
            return false;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component6() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.ImageQualityProbe.ImageQuality copy(double sharpness, double meanLuminance, double shadowFraction, double highlightFraction, boolean ok, @org.jetbrains.annotations.Nullable()
        java.lang.String issue) {
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