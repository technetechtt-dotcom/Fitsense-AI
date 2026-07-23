package com.fitsense.ai.measurement;

import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.Foot;
import com.fitsense.ai.models.FootMeasurement;
import javax.inject.Inject;

/**
 * Real millimetre measurement from user-placed reference corners and foot landmarks.
 * Mirrors the web `computeRealMeasurement` contract.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000V\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u000e\n\u0002\b\u0006\u0018\u00002\u00020\u0001:\u0003%&\'B\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u0010\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0004H\u0002J>\u0010\u0006\u001a\u00020\u00042\u0006\u0010\u0007\u001a\u00020\u00042\f\u0010\b\u001a\b\u0012\u0004\u0012\u00020\n0\t2\u0006\u0010\u000b\u001a\u00020\f2\u0006\u0010\r\u001a\u00020\f2\u0006\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u0011H\u0002JV\u0010\u0012\u001a\u00020\u00112\f\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00040\t2\f\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00040\t2\u0012\u0010\u0015\u001a\u000e\u0012\u0004\u0012\u00020\u0004\u0012\u0004\u0012\u00020\u00040\u00162\u0006\u0010\u000b\u001a\u00020\f2\u0006\u0010\r\u001a\u00020\f2\f\u0010\b\u001a\b\u0012\u0004\u0012\u00020\n0\tH\u0002J\u0016\u0010\u0017\u001a\u00020\u00182\u0006\u0010\u0019\u001a\u00020\u001a2\u0006\u0010\u001b\u001a\u00020\u001cJ&\u0010\u001d\u001a\u00020\u000f2\f\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\n0\t2\u0006\u0010\u001f\u001a\u00020\f2\u0006\u0010 \u001a\u00020\fH\u0002J\"\u0010!\u001a\u0004\u0018\u00010\"2\u0006\u0010#\u001a\u00020\u00042\u0006\u0010$\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fH\u0002\u00a8\u0006("}, d2 = {"Lcom/fitsense/ai/measurement/ReferenceMeasurement;", "", "()V", "clamp01", "", "v", "computeConfidence", "pixelsPerMm", "ordered", "", "Lcom/fitsense/ai/measurement/Point2D;", "imageWidthPx", "", "imageHeightPx", "widthMeasured", "", "sanity", "Lcom/fitsense/ai/measurement/ReferenceMeasurement$ReferenceSanity;", "computeSanity", "pxPerMm", "edgesPx", "dims", "Lkotlin/Pair;", "measure", "Lcom/fitsense/ai/measurement/ReferenceMeasurement$Result;", "taps", "Lcom/fitsense/ai/measurement/ReferenceMeasurement$TapPoints;", "reference", "Lcom/fitsense/ai/models/CalibrationReference;", "referenceHasFrameMargin", "corners", "widthPx", "heightPx", "validateDimensions", "", "lengthMm", "widthMm", "ReferenceSanity", "Result", "TapPoints", "app_debug"})
public final class ReferenceMeasurement {
    
    @javax.inject.Inject()
    public ReferenceMeasurement() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.ReferenceMeasurement.Result measure(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.ReferenceMeasurement.TapPoints taps, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference reference) {
        return null;
    }
    
    private final com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity computeSanity(java.util.List<java.lang.Double> pxPerMm, java.util.List<java.lang.Double> edgesPx, kotlin.Pair<java.lang.Double, java.lang.Double> dims, int imageWidthPx, int imageHeightPx, java.util.List<com.fitsense.ai.measurement.Point2D> ordered) {
        return null;
    }
    
    private final java.lang.String validateDimensions(double lengthMm, double widthMm, boolean widthMeasured) {
        return null;
    }
    
    private final double computeConfidence(double pixelsPerMm, java.util.List<com.fitsense.ai.measurement.Point2D> ordered, int imageWidthPx, int imageHeightPx, boolean widthMeasured, com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity sanity) {
        return 0.0;
    }
    
    private final boolean referenceHasFrameMargin(java.util.List<com.fitsense.ai.measurement.Point2D> corners, int widthPx, int heightPx) {
        return false;
    }
    
    private final double clamp01(double v) {
        return 0.0;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0010\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B\'\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\b\u00a2\u0006\u0002\u0010\tJ\t\u0010\u0011\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0012\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0013\u001a\u00020\u0006H\u00c6\u0003J\u000b\u0010\u0014\u001a\u0004\u0018\u00010\bH\u00c6\u0003J3\u0010\u0015\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\bH\u00c6\u0001J\u0013\u0010\u0016\u001a\u00020\u00062\b\u0010\u0017\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0018\u001a\u00020\u0019H\u00d6\u0001J\t\u0010\u001a\u001a\u00020\bH\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u0013\u0010\u0007\u001a\u0004\u0018\u00010\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u000b\u00a8\u0006\u001b"}, d2 = {"Lcom/fitsense/ai/measurement/ReferenceMeasurement$ReferenceSanity;", "", "aspectScore", "", "scaleConsistencyScore", "ok", "", "issue", "", "(DDZLjava/lang/String;)V", "getAspectScore", "()D", "getIssue", "()Ljava/lang/String;", "getOk", "()Z", "getScaleConsistencyScore", "component1", "component2", "component3", "component4", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
    public static final class ReferenceSanity {
        private final double aspectScore = 0.0;
        private final double scaleConsistencyScore = 0.0;
        private final boolean ok = false;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String issue = null;
        
        public ReferenceSanity(double aspectScore, double scaleConsistencyScore, boolean ok, @org.jetbrains.annotations.Nullable()
        java.lang.String issue) {
            super();
        }
        
        public final double getAspectScore() {
            return 0.0;
        }
        
        public final double getScaleConsistencyScore() {
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
        
        public final boolean component3() {
            return false;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component4() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity copy(double aspectScore, double scaleConsistencyScore, boolean ok, @org.jetbrains.annotations.Nullable()
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
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0011\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B%\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0013\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0007H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\tH\u00c6\u0003J1\u0010\u0017\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\tH\u00c6\u0001J\u0013\u0010\u0018\u001a\u00020\t2\b\u0010\u0019\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001a\u001a\u00020\u001bH\u00d6\u0001J\t\u0010\u001c\u001a\u00020\u001dH\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012\u00a8\u0006\u001e"}, d2 = {"Lcom/fitsense/ai/measurement/ReferenceMeasurement$Result;", "", "measurement", "Lcom/fitsense/ai/models/FootMeasurement;", "sanity", "Lcom/fitsense/ai/measurement/ReferenceMeasurement$ReferenceSanity;", "pixelsPerMm", "", "widthMeasured", "", "(Lcom/fitsense/ai/models/FootMeasurement;Lcom/fitsense/ai/measurement/ReferenceMeasurement$ReferenceSanity;DZ)V", "getMeasurement", "()Lcom/fitsense/ai/models/FootMeasurement;", "getPixelsPerMm", "()D", "getSanity", "()Lcom/fitsense/ai/measurement/ReferenceMeasurement$ReferenceSanity;", "getWidthMeasured", "()Z", "component1", "component2", "component3", "component4", "copy", "equals", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class Result {
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.FootMeasurement measurement = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity sanity = null;
        private final double pixelsPerMm = 0.0;
        private final boolean widthMeasured = false;
        
        public Result(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.FootMeasurement measurement, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity sanity, double pixelsPerMm, boolean widthMeasured) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.FootMeasurement getMeasurement() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity getSanity() {
            return null;
        }
        
        public final double getPixelsPerMm() {
            return 0.0;
        }
        
        public final boolean getWidthMeasured() {
            return false;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.FootMeasurement component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity component2() {
            return null;
        }
        
        public final double component3() {
            return 0.0;
        }
        
        public final boolean component4() {
            return false;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.ReferenceMeasurement.Result copy(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.FootMeasurement measurement, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.ReferenceMeasurement.ReferenceSanity sanity, double pixelsPerMm, boolean widthMeasured) {
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
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0018\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001BO\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0004\u0012\u0006\u0010\u0006\u001a\u00020\u0004\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0004\u0012\b\u0010\b\u001a\u0004\u0018\u00010\u0004\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\f\u0012\u0006\u0010\r\u001a\u00020\f\u00a2\u0006\u0002\u0010\u000eJ\u000f\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003H\u00c6\u0003J\t\u0010\u001c\u001a\u00020\u0004H\u00c6\u0003J\t\u0010\u001d\u001a\u00020\u0004H\u00c6\u0003J\u000b\u0010\u001e\u001a\u0004\u0018\u00010\u0004H\u00c6\u0003J\u000b\u0010\u001f\u001a\u0004\u0018\u00010\u0004H\u00c6\u0003J\t\u0010 \u001a\u00020\nH\u00c6\u0003J\t\u0010!\u001a\u00020\fH\u00c6\u0003J\t\u0010\"\u001a\u00020\fH\u00c6\u0003Jc\u0010#\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00042\b\b\u0002\u0010\u0006\u001a\u00020\u00042\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u00042\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\f2\b\b\u0002\u0010\r\u001a\u00020\fH\u00c6\u0001J\u0013\u0010$\u001a\u00020%2\b\u0010&\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\'\u001a\u00020\fH\u00d6\u0001J\t\u0010(\u001a\u00020)H\u00d6\u0001R\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0005\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\r\u001a\u00020\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\u000b\u001a\u00020\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0014R\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0011\u0010\u0006\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0012R\u0013\u0010\b\u001a\u0004\u0018\u00010\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u0012R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u0012\u00a8\u0006*"}, d2 = {"Lcom/fitsense/ai/measurement/ReferenceMeasurement$TapPoints;", "", "refCorners", "", "Lcom/fitsense/ai/measurement/Point2D;", "heel", "toe", "widthMedial", "widthLateral", "foot", "Lcom/fitsense/ai/models/Foot;", "imageWidthPx", "", "imageHeightPx", "(Ljava/util/List;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/models/Foot;II)V", "getFoot", "()Lcom/fitsense/ai/models/Foot;", "getHeel", "()Lcom/fitsense/ai/measurement/Point2D;", "getImageHeightPx", "()I", "getImageWidthPx", "getRefCorners", "()Ljava/util/List;", "getToe", "getWidthLateral", "getWidthMedial", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "copy", "equals", "", "other", "hashCode", "toString", "", "app_debug"})
    public static final class TapPoints {
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<com.fitsense.ai.measurement.Point2D> refCorners = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D heel = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D toe = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.measurement.Point2D widthMedial = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.measurement.Point2D widthLateral = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.Foot foot = null;
        private final int imageWidthPx = 0;
        private final int imageHeightPx = 0;
        
        public TapPoints(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot, int imageWidthPx, int imageHeightPx) {
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
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.measurement.Point2D getWidthMedial() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.measurement.Point2D getWidthLateral() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot getFoot() {
            return null;
        }
        
        public final int getImageWidthPx() {
            return 0;
        }
        
        public final int getImageHeightPx() {
            return 0;
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
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.measurement.Point2D component4() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.measurement.Point2D component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot component6() {
            return null;
        }
        
        public final int component7() {
            return 0;
        }
        
        public final int component8() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.ReferenceMeasurement.TapPoints copy(@org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot, int imageWidthPx, int imageHeightPx) {
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