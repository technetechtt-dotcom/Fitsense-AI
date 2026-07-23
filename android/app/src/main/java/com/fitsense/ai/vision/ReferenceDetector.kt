package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.measurement.distance
import com.fitsense.ai.measurement.sortCornersTopLeft
import com.fitsense.ai.models.CalibrationReference
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc
import javax.inject.Inject
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

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
        /** True when a second rectangle scored nearly as high — prefer manual markup. */
        val ambiguous: Boolean = false,
    )

    fun detectCorners(
        bitmap: Bitmap,
        calibration: CalibrationReference = CalibrationReference.A4_PAPER,
    ): Detection? {
        if (calibration == CalibrationReference.ARCORE_PLANE) return null
        val src = preprocessor.bitmapToMat(bitmap)
        val edges = preprocessor.pipeline(src)
        val contours = ArrayList<MatOfPoint>()
        val hierarchy = org.opencv.core.Mat()
        return try {
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
            var secondScore = 0.0
            for (contour in contours) {
                val contour2f = MatOfPoint2f(*contour.toArray())
                val peri = Imgproc.arcLength(contour2f, true)
                if (peri < 200) {
                    contour2f.release()
                    continue
                }
                val approx = MatOfPoint2f()
                Imgproc.approxPolyDP(contour2f, approx, 0.02 * peri, true)
                contour2f.release()
                val points = approx.toArray()
                approx.release()
                if (points.size != 4) continue
                val approxInt = MatOfPoint(*points)
                val convex = Imgproc.isContourConvex(approxInt)
                approxInt.release()
                if (!convex) continue
                val area = abs(Imgproc.contourArea(contour))
                val areaFraction = area / frameArea
                if (areaFraction < MIN_AREA_FRACTION || areaFraction > MAX_AREA_FRACTION) continue
                val quad = sortCornersTopLeft(points.map { Point2D(it.x, it.y) })
                if (!hasRectangleLikeAngles(quad)) continue
                val score = scoreQuad(quad, expectedAspect, areaFraction)
                if (best == null || score > best.confidence) {
                    secondScore = best?.confidence ?: 0.0
                    best = Detection(corners = quad, confidence = score, areaPx = area)
                } else if (score > secondScore) {
                    secondScore = score
                }
            }
            val candidate = best ?: return null
            if (candidate.confidence < MIN_CONFIDENCE) return null
            val ambiguous =
                secondScore > 0.0 && (candidate.confidence - secondScore) < AMBIGUITY_DELTA
            // Ambiguous multi-rectangle scenes are unsafe to auto-accept.
            if (ambiguous) return null
            candidate
        } finally {
            hierarchy.release()
            edges.release()
            contours.forEach { it.release() }
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

    /** Reject folded / heavily skewed quads whose corner angles leave ~90°. */
    private fun hasRectangleLikeAngles(corners: List<Point2D>): Boolean {
        if (corners.size != 4) return false
        for (i in 0 until 4) {
            val prev = corners[(i + 3) % 4]
            val curr = corners[i]
            val next = corners[(i + 1) % 4]
            val ax = prev.x - curr.x
            val ay = prev.y - curr.y
            val bx = next.x - curr.x
            val by = next.y - curr.y
            val magA = sqrt(ax * ax + ay * ay)
            val magB = sqrt(bx * bx + by * by)
            if (magA < 1e-3 || magB < 1e-3) return false
            val cos = ((ax * bx + ay * by) / (magA * magB)).coerceIn(-1.0, 1.0)
            val degrees = Math.toDegrees(acos(cos))
            if (degrees < 55.0 || degrees > 125.0) return false
        }
        return true
    }

    companion object {
        private const val MIN_AREA_FRACTION = 0.05
        private const val MAX_AREA_FRACTION = 0.85
        private const val MIN_CONFIDENCE = 0.6
        private const val AMBIGUITY_DELTA = 0.08
    }
}
