package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import com.fitsense.ai.utils.Constants;
import org.opencv.android.Utils;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import javax.inject.Inject;

/**
 * Reusable OpenCV preprocessing steps:
 *  bitmap → RGBA Mat
 *  grayscale conversion
 *  Gaussian blur
 *  adaptive Canny edge detection
 *  morphological closing to bridge contour gaps
 *
 * All Mat allocations are freed by [release]; callers should wrap with
 * `try/finally` to avoid leaking native memory on long sessions.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\t\u0018\u00002\u00020\u0001:\u0001\u0012B\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006J\u0018\u0010\u0007\u001a\u00020\u00042\u0006\u0010\b\u001a\u00020\u00042\b\b\u0002\u0010\t\u001a\u00020\nJ\u0018\u0010\u000b\u001a\u00020\u00042\u0006\u0010\f\u001a\u00020\u00042\b\b\u0002\u0010\r\u001a\u00020\nJ\u000e\u0010\b\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u0004J\u000e\u0010\u000f\u001a\u00020\u00042\u0006\u0010\u0010\u001a\u00020\u0004J\u000e\u0010\u0011\u001a\u00020\u00042\u0006\u0010\u0010\u001a\u00020\u0004\u00a8\u0006\u0013"}, d2 = {"Lcom/fitsense/ai/vision/ImagePreprocessor;", "", "()V", "bitmapToMat", "Lorg/opencv/core/Mat;", "bitmap", "Landroid/graphics/Bitmap;", "close", "edges", "kernelSize", "", "denoise", "gray", "kernel", "blurred", "pipeline", "src", "toGray", "Stage", "app_debug"})
public final class ImagePreprocessor {
    
    @javax.inject.Inject()
    public ImagePreprocessor() {
        super();
    }
    
    /**
     * Convert a [Bitmap] to RGBA Mat (callers own the Mat and must release it).
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat bitmapToMat(@org.jetbrains.annotations.NotNull()
    android.graphics.Bitmap bitmap) {
        return null;
    }
    
    /**
     * Returns a single-channel grayscale Mat.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat toGray(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat src) {
        return null;
    }
    
    /**
     * Gaussian blur with a fixed kernel that balances detail vs noise on phone cameras.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat denoise(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat gray, int kernel) {
        return null;
    }
    
    /**
     * Canny edges using thresholds tuned for soft-shadowed foot photos.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat edges(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat blurred) {
        return null;
    }
    
    /**
     * Closes ~1px gaps in the edge map so [Imgproc.findContours] returns full silhouettes.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat close(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat edges, int kernelSize) {
        return null;
    }
    
    /**
     * Convenience: produces the closed edge map in one call, freeing intermediates.
     */
    @org.jetbrains.annotations.NotNull()
    public final org.opencv.core.Mat pipeline(@org.jetbrains.annotations.NotNull()
    org.opencv.core.Mat src) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B\u0015\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\t\u0010\u000b\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\f\u001a\u00020\u0005H\u00c6\u0003J\u001d\u0010\r\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u0005H\u00c6\u0001J\u0013\u0010\u000e\u001a\u00020\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0011\u001a\u00020\u0012H\u00d6\u0001J\t\u0010\u0013\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0007\u0010\bR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\n\u00a8\u0006\u0014"}, d2 = {"Lcom/fitsense/ai/vision/ImagePreprocessor$Stage;", "", "name", "", "mat", "Lorg/opencv/core/Mat;", "(Ljava/lang/String;Lorg/opencv/core/Mat;)V", "getMat", "()Lorg/opencv/core/Mat;", "getName", "()Ljava/lang/String;", "component1", "component2", "copy", "equals", "", "other", "hashCode", "", "toString", "app_debug"})
    public static final class Stage {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String name = null;
        @org.jetbrains.annotations.NotNull()
        private final org.opencv.core.Mat mat = null;
        
        public Stage(@org.jetbrains.annotations.NotNull()
        java.lang.String name, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Mat mat) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getName() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Mat getMat() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final org.opencv.core.Mat component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.ImagePreprocessor.Stage copy(@org.jetbrains.annotations.NotNull()
        java.lang.String name, @org.jetbrains.annotations.NotNull()
        org.opencv.core.Mat mat) {
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