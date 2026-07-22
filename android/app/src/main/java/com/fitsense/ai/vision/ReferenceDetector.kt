package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.measurement.sortCornersTopLeft
import org.opencv.core.MatOfPoint
import org.opencv.imgproc.Imgproc
import javax.inject.Inject
import kotlin.math.abs

/**
 * Attempts to locate a rectangular reference object (A4 / card) in the frame.
 * Returns four image-space corners or null when uncertain.
 */
class ReferenceDetector @Inject constructor(
    private val preprocessor: ImagePreprocessor,
) {
    fun detectCorners(bitmap: Bitmap): List<Point2D>? {
        val src = preprocessor.bitmapToMat(bitmap)
        return try {
            val edges = preprocessor.pipeline(src)
            val contours = ArrayList<org.opencv.core.MatOfPoint>()
            val hierarchy = org.opencv.core.Mat()
            Imgproc.findContours(edges, contours, hierarchy, Imgproc.RETR_LIST, Imgproc.CHAIN_APPROX_SIMPLE)
            val frameArea = bitmap.width.toDouble() * bitmap.height
            val candidates = contours.mapNotNull { contour ->
                val peri = Imgproc.arcLength(org.opencv.core.MatOfPoint2f(*contour.toArray()), true)
                val approx = org.opencv.core.MatOfPoint2f()
                Imgproc.approxPolyDP(org.opencv.core.MatOfPoint2f(*contour.toArray()), approx, 0.02 * peri, true)
                val points = approx.toArray()
                approx.release()
                if (points.size != 4) return@mapNotNull null
                val area = abs(Imgproc.contourArea(contour))
                if (area < frameArea * 0.04 || area > frameArea * 0.75) return@mapNotNull null
                val quad = points.map { Point2D(it.x, it.y) }
                area to sortCornersTopLeft(quad)
            }.sortedByDescending { it.first }
            candidates.firstOrNull()?.second
        } finally {
            src.release()
        }
    }
}
