package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.measurement.distance
import com.fitsense.ai.measurement.sortCornersTopLeft
import com.fitsense.ai.models.CalibrationReference
import org.opencv.imgproc.Imgproc
import javax.inject.Inject
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Locates a rectangular reference object (A4 / card). Returns null when
 * uncertain — never invents a default quad.
 */
class ReferenceDetector @Inject constructor(
    private val preprocessor: ImagePreprocessor,
) {
    data class Detection(
        val corners: List<Point2D>,
        val confidence: Double,
        val areaPx: Double,
    )

    fun detectCorners(
        bitmap: Bitmap,
        calibration: CalibrationReference = CalibrationReference.A4_PAPER,
    ): Detection? {
        if (calibration == CalibrationReference.ARCORE_PLANE) return null
        val src = preprocessor.bitmapToMat(bitmap)
        return try {
            val edges = preprocessor.pipeline(src)
            val contours = ArrayList<org.opencv.core.MatOfPoint>()
            val hierarchy = org.opencv.core.Mat()
            Imgproc.findContours(
                edges,
                contours,
                hierarchy,
                Imgproc.RETR_LIST,
                Imgproc.CHAIN_APPROX_SIMPLE,
            )
            val frameArea = bitmap.width.toDouble() * bitmap.height
            val expectedAspect = calibration.heightMm / calibration.widthMm
            var best: Detection? = null
            for (contour in contours) {
                val peri = Imgproc.arcLength(org.opencv.core.MatOfPoint2f(*contour.toArray()), true)
                if (peri < 200) continue
                val approx = org.opencv.core.MatOfPoint2f()
                Imgproc.approxPolyDP(
                    org.opencv.core.MatOfPoint2f(*contour.toArray()),
                    approx,
                    0.02 * peri,
                    true,
                )
                val points = approx.toArray()
                approx.release()
                if (points.size != 4) continue
                val area = abs(Imgproc.contourArea(contour))
                val areaFraction = area / frameArea
                if (areaFraction < MIN_AREA_FRACTION || areaFraction > MAX_AREA_FRACTION) continue
                val quad = sortCornersTopLeft(points.map { Point2D(it.x, it.y) })
                val score = scoreQuad(quad, expectedAspect, areaFraction)
                if (best == null || score > best.confidence) {
                    best = Detection(corners = quad, confidence = score, areaPx = area)
                }
            }
            hierarchy.release()
            if (best == null || best.confidence < MIN_CONFIDENCE) null else best
        } finally {
            src.release()
        }
    }

    private fun scoreQuad(corners: List<Point2D>, expectedAspect: Double, areaFraction: Double): Double {
        val width = distance(corners[0], corners[1])
        val height = distance(corners[1], corners[2])
        if (width < 1.0 || height < 1.0) return 0.0
        val aspect = max(width, height) / min(width, height)
        val aspectError = abs(aspect - expectedAspect) / expectedAspect
        val aspectScore = (1.0 - aspectError.coerceIn(0.0, 1.0)).coerceIn(0.0, 1.0)
        val coverageScore = when {
            areaFraction in 0.12..0.55 -> 1.0
            areaFraction in 0.08..0.70 -> 0.7
            else -> 0.4
        }
        return 0.7 * aspectScore + 0.3 * coverageScore
    }

    companion object {
        private const val MIN_AREA_FRACTION = 0.05
        private const val MAX_AREA_FRACTION = 0.85
        private const val MIN_CONFIDENCE = 0.6
    }
}
