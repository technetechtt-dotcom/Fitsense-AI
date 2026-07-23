package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import com.fitsense.ai.utils.Constants;
import org.opencv.core.Mat;
import org.opencv.core.MatOfPoint;
import org.opencv.core.Point;
import org.opencv.core.Rect;
import org.opencv.imgproc.Imgproc;
import javax.inject.Inject;

/**
 * Detects the foot silhouette in a [Bitmap] and derives geometry useful for
 * sizing:
 *
 *  • bounding rectangle (for crop / preview overlay)
 *  • heel & toe points (foot length axis)
 *  • widest perpendicular span (foot width)
 *  • confidence estimate (contour sharpness + area)
 *
 * The detector assumes the foot is roughly centered, against a contrasting
 * surface (e.g. the A4 calibration sheet or a uniform floor).
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000P\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\b\u0005\u0018\u00002\u00020\u0001:\u0001\u001cB\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J(\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\n2\u0006\u0010\f\u001a\u00020\rH\u0002J\u0010\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\u0006\u0010\u0010\u001a\u00020\u0011J\u0010\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\u0006\u0010\u0012\u001a\u00020\u0013J\"\u0010\u0014\u001a\u000e\u0012\u0004\u0012\u00020\u0016\u0012\u0004\u0012\u00020\u00160\u00152\f\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00160\u0018H\u0002J2\u0010\u0019\u001a\u000e\u0012\u0004\u0012\u00020\u0016\u0012\u0004\u0012\u00020\u00160\u00152\f\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00160\u00182\u0006\u0010\u001a\u001a\u00020\u00162\u0006\u0010\u001b\u001a\u00020\u0016H\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u001d"}, d2 = {"Lcom/fitsense/ai/vision/FootContourDetector;", "", "preprocessor", "Lcom/fitsense/ai/vision/ImagePreprocessor;", "(Lcom/fitsense/ai/vision/ImagePreprocessor;)V", "computeConfidence", "", "rect", "Lorg/opencv/core/Rect;", "w", "", "h", "area", "", "detect", "Lcom/fitsense/ai/vision/FootContourDetector$FootContour;", "bitmap", "Landroid/graphics/Bitmap;", "src", "Lorg/opencv/core/Mat;", "findHeelAndToe", "Lkotlin/Pair;", "Lorg/opencv/core/Point;", "points", "", "findWidestSpan", "heel", "toe", "FootContour", "app_debug"})
public final class FootContourDetector {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.ImagePreprocessor preprocessor = null;
    
    @javax.inject.Inject()
    public FootContourDetector(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ImagePreprocessor preprocessor) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.fitsense.ai.vision.FootContourDetector.FootContour detect(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.fitsense.ai.vision.FootContourDetector.FootContour detect(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat src) {
        return null;
    }
    
    /**
     * Heel = bottom-most contour point (largest Y, since image Y grows downward).
     * Toe  = top-most contour point (smallest Y).
     *
     * If users hold the phone landscape, callers should rotate the bitmap first
     * — this keeps the algorithm simple and deterministic.
     */
    private final kotlin.Pair<org.opencv.core.Point, org.opencv.core.Point> findHeelAndToe(java.util.List<? extends org.opencv.core.Point> points) {
        return null;
    }
    
    /**
     * Project every contour point onto the heel→toe axis, group them into
     * horizontal "slices", then find the slice with the largest perpendicular
     * spread. That spread is the foot width.
     */
    private final kotlin.Pair<org.opencv.core.Point, org.opencv.core.Point> findWidestSpan(java.util.List<? extends org.opencv.core.Point> points, org.opencv.core.Point heel, org.opencv.core.Point toe) {
        return null;
    }
    
    private final float computeConfidence(org.opencv.core.Rect rect, int w, int h, double area) {
        return 0.0F;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000B\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0000\n\u0002\u0010\u0007\n\u0002\b\n\n\u0002\u0010\u0006\n\u0002\b\u0010\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001BC\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0003\u0012\u0006\u0010\u0006\u001a\u00020\u0003\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00030\n\u0012\u0006\u0010\u000b\u001a\u00020\f\u00a2\u0006\u0002\u0010\rJ\t\u0010\u001f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010 \u001a\u00020\u0003H\u00c6\u0003J\t\u0010!\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\"\u001a\u00020\u0003H\u00c6\u0003J\t\u0010#\u001a\u00020\bH\u00c6\u0003J\u000f\u0010$\u001a\b\u0012\u0004\u0012\u00020\u00030\nH\u00c6\u0003J\t\u0010%\u001a\u00020\fH\u00c6\u0003JU\u0010&\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00032\b\b\u0002\u0010\u0006\u001a\u00020\u00032\b\b\u0002\u0010\u0007\u001a\u00020\b2\u000e\b\u0002\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00030\n2\b\b\u0002\u0010\u000b\u001a\u00020\fH\u00c6\u0001J\u0013\u0010\'\u001a\u00020(2\b\u0010)\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010*\u001a\u00020+H\u00d6\u0001J\t\u0010,\u001a\u00020-H\u00d6\u0001R\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u0011\u0010\u000b\u001a\u00020\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u0011R\u0017\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00030\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u0013R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\u0015R\u0011\u0010\u0016\u001a\u00020\u00178F\u00a2\u0006\u0006\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u0015R\u0011\u0010\u0005\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u0015R\u0011\u0010\u0006\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u0015R\u0011\u0010\u001d\u001a\u00020\u00178F\u00a2\u0006\u0006\u001a\u0004\b\u001e\u0010\u0019\u00a8\u0006."}, d2 = {"Lcom/fitsense/ai/vision/FootContourDetector$FootContour;", "", "heel", "Lorg/opencv/core/Point;", "toe", "widthA", "widthB", "boundingRect", "Lorg/opencv/core/Rect;", "contour", "", "confidence", "", "(Lorg/opencv/core/Point;Lorg/opencv/core/Point;Lorg/opencv/core/Point;Lorg/opencv/core/Point;Lorg/opencv/core/Rect;Ljava/util/List;F)V", "getBoundingRect", "()Lorg/opencv/core/Rect;", "getConfidence", "()F", "getContour", "()Ljava/util/List;", "getHeel", "()Lorg/opencv/core/Point;", "lengthPx", "", "getLengthPx", "()D", "getToe", "getWidthA", "getWidthB", "widthPx", "getWidthPx", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "copy", "equals", "", "other", "hashCode", "", "toString", "", "app_debug"})
    public static final class FootContour {
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Point heel = null;
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Point toe = null;
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Point widthA = null;
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Point widthB = null;
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Rect boundingRect = null;
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<org.opencv.core.Point> contour = null;
        private final float confidence = 0.0F;
        
        public FootContour(@org.jetbrains.annotations.NotNull()
        org.opencv.core.Point heel, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point toe, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point widthA, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point widthB, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Rect boundingRect, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends org.opencv.core.Point> contour, float confidence) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point getHeel() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point getToe() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point getWidthA() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point getWidthB() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Rect getBoundingRect() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<org.opencv.core.Point> getContour() {
            return null;
        }
        
        public final float getConfidence() {
            return 0.0F;
        }
        
        public final double getLengthPx() {
            return 0.0;
        }
        
        public final double getWidthPx() {
            return 0.0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Point component4() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Rect component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<org.opencv.core.Point> component6() {
            return null;
        }
        
        public final float component7() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.FootContourDetector.FootContour copy(@org.jetbrains.annotations.NotNull()
        org.opencv.core.Point heel, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point toe, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point widthA, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Point widthB, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Rect boundingRect, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends org.opencv.core.Point> contour, float confidence) {
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