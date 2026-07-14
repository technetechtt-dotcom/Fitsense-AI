package com.fitsense.ai.vision

import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import javax.inject.Inject

/**
 * Warps a quadrilateral region of an image onto a rectangle, removing perspective
 * distortion. Used when the user calibrates with an A4 sheet — we straighten the
 * sheet before measuring pixel dimensions.
 */
class PerspectiveCorrection @Inject constructor() {

    /**
     * @param srcQuad four points (any order) describing a quadrilateral in [src].
     * @param outputSize desired rectified output size.
     * @return a new Mat the size of [outputSize]; caller releases.
     */
    fun warp(src: Mat, srcQuad: List<Point>, outputSize: Size): Mat {
        require(srcQuad.size == 4) { "Perspective warp needs exactly 4 source points." }

        val ordered = orderClockwise(srcQuad)
        val srcPts = MatOfPoint2f(*ordered.toTypedArray())
        val dstPts = MatOfPoint2f(
            Point(0.0, 0.0),
            Point(outputSize.width - 1.0, 0.0),
            Point(outputSize.width - 1.0, outputSize.height - 1.0),
            Point(0.0, outputSize.height - 1.0),
        )

        val transform = Imgproc.getPerspectiveTransform(srcPts, dstPts)
        val warped = Mat()
        Imgproc.warpPerspective(src, warped, transform, outputSize)

        srcPts.release(); dstPts.release(); transform.release()
        return warped
    }

    /** Sort 4 points TL → TR → BR → BL (helps the perspective transform stay stable). */
    private fun orderClockwise(points: List<Point>): List<Point> {
        val sumAsc = points.sortedBy { it.x + it.y }       // TL has smallest, BR largest
        val diffAsc = points.sortedBy { it.y - it.x }       // TR smallest, BL largest
        val tl = sumAsc.first()
        val br = sumAsc.last()
        val tr = diffAsc.first()
        val bl = diffAsc.last()
        return listOf(tl, tr, br, bl)
    }
}
