package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.utils.Constants
import org.opencv.android.Utils
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import javax.inject.Inject

/**
 * Reusable OpenCV preprocessing steps:
 *   bitmap → RGBA Mat
 *   grayscale conversion
 *   Gaussian blur
 *   adaptive Canny edge detection
 *   morphological closing to bridge contour gaps
 *
 * All Mat allocations are freed by [release]; callers should wrap with
 * `try/finally` to avoid leaking native memory on long sessions.
 */
class ImagePreprocessor @Inject constructor() {

    data class Stage(val name: String, val mat: Mat)

    /** Convert a [Bitmap] to RGBA Mat (callers own the Mat and must release it). */
    fun bitmapToMat(bitmap: Bitmap): Mat {
        val mat = Mat(bitmap.height, bitmap.width, CvType.CV_8UC4)
        Utils.bitmapToMat(bitmap, mat)
        return mat
    }

    /** Returns a single-channel grayscale Mat. */
    fun toGray(src: Mat): Mat {
        val gray = Mat()
        Imgproc.cvtColor(src, gray, Imgproc.COLOR_RGBA2GRAY)
        return gray
    }

    /** Gaussian blur with a fixed kernel that balances detail vs noise on phone cameras. */
    fun denoise(gray: Mat, kernel: Int = 5): Mat {
        val blurred = Mat()
        Imgproc.GaussianBlur(gray, blurred, Size(kernel.toDouble(), kernel.toDouble()), 0.0)
        return blurred
    }

    /** Canny edges using thresholds tuned for soft-shadowed foot photos. */
    fun edges(blurred: Mat): Mat {
        val edges = Mat()
        Imgproc.Canny(blurred, edges, Constants.CANNY_LOW_THRESHOLD, Constants.CANNY_HIGH_THRESHOLD)
        return edges
    }

    /** Closes ~1px gaps in the edge map so [Imgproc.findContours] returns full silhouettes. */
    fun close(edges: Mat, kernelSize: Int = 5): Mat {
        val closed = Mat()
        val kernel = Imgproc.getStructuringElement(
            Imgproc.MORPH_ELLIPSE,
            Size(kernelSize.toDouble(), kernelSize.toDouble()),
        )
        Imgproc.morphologyEx(edges, closed, Imgproc.MORPH_CLOSE, kernel)
        kernel.release()
        return closed
    }

    /** Convenience: produces the closed edge map in one call, freeing intermediates. */
    fun pipeline(src: Mat): Mat {
        val gray = toGray(src)
        val blurred = denoise(gray)
        val edged = edges(blurred)
        val closed = close(edged)
        gray.release(); blurred.release(); edged.release()
        return closed
    }
}
