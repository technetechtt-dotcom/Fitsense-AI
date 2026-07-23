package com.fitsense.ai.vision;

import org.opencv.core.Mat;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.Point;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import javax.inject.Inject;

/**
 * Warps a quadrilateral region of an image onto a rectangle, removing perspective
 * distortion. Used when the user calibrates with an A4 sheet — we straighten the
 * sheet before measuring pixel dimensions.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\u0018\u00002\u00020\u0001B\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u001c\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u00042\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u0002J$\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\b2\f\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u00050\u00042\u0006\u0010\u000b\u001a\u00020\f\u00a8\u0006\r"}, d2 = {"Lcom/fitsense/ai/vision/PerspectiveCorrection;", "", "()V", "orderClockwise", "", "Lorg/opencv/core/Point;", "points", "warp", "Lorg/opencv/core/Mat;", "src", "srcQuad", "outputSize", "Lorg/opencv/core/Size;", "app_debug"})
public final class PerspectiveCorrection {
    
    @javax.inject.Inject()
    public PerspectiveCorrection() {
        super();
    }
    
    /**
     * @param srcQuad four points (any order) describing a quadrilateral in [src].
     * @param outputSize desired rectified output size.
     * @return a new Mat the size of [outputSize]; caller releases.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat warp(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat src, @org.jetbrains.annotations.NotNull()
    java.util.List<? extends org.opencv.core.Point> srcQuad, @org.jetbrains.annotations.NotNull()
    org.opencv.core.Size outputSize) {
        return null;
    }
    
    /**
     * Sort 4 points TL → TR → BR → BL (helps the perspective transform stay stable).
     */
    private final java.util.List<org.opencv.core.Point> orderClockwise(java.util.List<? extends org.opencv.core.Point> points) {
        return null;
    }
}