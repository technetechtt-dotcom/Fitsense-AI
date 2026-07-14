package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.utils.Constants
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.imgproc.Imgproc
import javax.inject.Inject
import kotlin.math.hypot
import kotlin.math.max

/**
 * Detects the foot silhouette in a [Bitmap] and derives geometry useful for
 * sizing:
 *
 *   • bounding rectangle (for crop / preview overlay)
 *   • heel & toe points (foot length axis)
 *   • widest perpendicular span (foot width)
 *   • confidence estimate (contour sharpness + area)
 *
 * The detector assumes the foot is roughly centered, against a contrasting
 * surface (e.g. the A4 calibration sheet or a uniform floor).
 */
class FootContourDetector @Inject constructor(
    private val preprocessor: ImagePreprocessor,
) {

    data class FootContour(
        val heel: Point,
        val toe: Point,
        val widthA: Point,
        val widthB: Point,
        val boundingRect: Rect,
        val contour: List<Point>,
        val confidence: Float,
    ) {
        val lengthPx: Double get() = hypot(toe.x - heel.x, toe.y - heel.y)
        val widthPx: Double get() = hypot(widthB.x - widthA.x, widthB.y - widthA.y)
    }

    fun detect(bitmap: Bitmap): FootContour? {
        val src = preprocessor.bitmapToMat(bitmap)
        return try {
            detect(src)
        } finally {
            src.release()
        }
    }

    fun detect(src: Mat): FootContour? {
        val edges = preprocessor.pipeline(src)
        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()

        return try {
            Imgproc.findContours(
                edges, contours, hierarchy,
                Imgproc.RETR_EXTERNAL,
                Imgproc.CHAIN_APPROX_NONE,
            )

            val candidate = contours
                .map { it to Imgproc.contourArea(it) }
                .filter { it.second >= Constants.MIN_FOOT_CONTOUR_AREA }
                .maxByOrNull { it.second }
                ?: return null

            val contourMat = candidate.first
            val boundingRect = Imgproc.boundingRect(contourMat)
            val points = contourMat.toList()
            val (heel, toe) = findHeelAndToe(points)
            val (widthA, widthB) = findWidestSpan(points, heel, toe)
            val confidence = computeConfidence(boundingRect, src.width(), src.height(), candidate.second)

            FootContour(
                heel = heel,
                toe = toe,
                widthA = widthA,
                widthB = widthB,
                boundingRect = boundingRect,
                contour = points,
                confidence = confidence,
            )
        } finally {
            edges.release(); hierarchy.release()
            contours.forEach { it.release() }
        }
    }

    /**
     * Heel = bottom-most contour point (largest Y, since image Y grows downward).
     * Toe  = top-most contour point (smallest Y).
     *
     * If users hold the phone landscape, callers should rotate the bitmap first
     * — this keeps the algorithm simple and deterministic.
     */
    private fun findHeelAndToe(points: List<Point>): Pair<Point, Point> {
        val heel = points.maxByOrNull { it.y } ?: points.first()
        val toe = points.minByOrNull { it.y } ?: points.last()
        return heel to toe
    }

    /**
     * Project every contour point onto the heel→toe axis, group them into
     * horizontal "slices", then find the slice with the largest perpendicular
     * spread. That spread is the foot width.
     */
    private fun findWidestSpan(
        points: List<Point>,
        heel: Point,
        toe: Point,
    ): Pair<Point, Point> {
        val dx = toe.x - heel.x
        val dy = toe.y - heel.y
        val axisLen = hypot(dx, dy).coerceAtLeast(1.0)
        val ux = dx / axisLen
        val uy = dy / axisLen
        // Perpendicular unit vector (rotated 90°).
        val px = -uy
        val py = ux

        // Project every point onto axis (t) and onto perpendicular (s).
        val projected = points.map { p ->
            val rx = p.x - heel.x
            val ry = p.y - heel.y
            Triple(rx * ux + ry * uy, rx * px + ry * py, p)
        }

        // Bucket by t into ~40 bins between heel & toe.
        val bins = 40
        val maxT = axisLen
        val bucketSize = maxT / bins

        val minByBucket = HashMap<Int, Triple<Double, Double, Point>>()
        val maxByBucket = HashMap<Int, Triple<Double, Double, Point>>()
        for (item in projected) {
            val t = item.first
            if (t < 0 || t > maxT) continue
            val bin = (t / bucketSize).toInt().coerceIn(0, bins - 1)
            val curMin = minByBucket[bin]
            val curMax = maxByBucket[bin]
            if (curMin == null || item.second < curMin.second) minByBucket[bin] = item
            if (curMax == null || item.second > curMax.second) maxByBucket[bin] = item
        }

        // Search bin with widest spread.
        var bestSpread = 0.0
        var bestPair: Pair<Point, Point> = heel to toe
        for (bin in 0 until bins) {
            val a = minByBucket[bin] ?: continue
            val b = maxByBucket[bin] ?: continue
            val spread = b.second - a.second
            if (spread > bestSpread) {
                bestSpread = spread
                bestPair = a.third to b.third
            }
        }
        return bestPair
    }

    private fun computeConfidence(rect: Rect, w: Int, h: Int, area: Double): Float {
        // Larger, well-bounded contours score higher (max at half of frame width).
        val widthScore = (rect.width.toFloat() / (w.toFloat() * 0.5f)).coerceIn(0f, 1f)
        val heightScore = (rect.height.toFloat() / (h.toFloat() * 0.8f)).coerceIn(0f, 1f)
        val areaScore = (area.toFloat() / (w * h * 0.25f).coerceAtLeast(1f)).coerceIn(0f, 1f)
        return max(0.05f, (0.4f * widthScore + 0.4f * heightScore + 0.2f * areaScore))
    }
}
