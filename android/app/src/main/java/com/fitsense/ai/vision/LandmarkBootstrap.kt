package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.models.Foot
import javax.inject.Inject

/** Seeds markup landmarks when auto-detection is uncertain. */
class LandmarkBootstrap @Inject constructor(
    private val referenceDetector: ReferenceDetector,
    private val contourDetector: FootContourDetector,
) {
    data class Bootstrap(
        val refCorners: List<Point2D>,
        val heel: Point2D,
        val toe: Point2D,
        val widthMedial: Point2D,
        val widthLateral: Point2D,
    )

    fun bootstrap(bitmap: Bitmap, foot: Foot): Bootstrap {
        val w = bitmap.width.toDouble()
        val h = bitmap.height.toDouble()
        val ref = referenceDetector.detectCorners(bitmap) ?: defaultReferenceQuad(w, h)
        val contour = contourDetector.detect(bitmap)
        return if (contour != null) {
            Bootstrap(
                refCorners = ref,
                heel = Point2D(contour.heel.x, contour.heel.y),
                toe = Point2D(contour.toe.x, contour.toe.y),
                widthMedial = Point2D(contour.widthA.x, contour.widthA.y),
                widthLateral = Point2D(contour.widthB.x, contour.widthB.y),
            )
        } else {
            val centerX = w * 0.5
            Bootstrap(
                refCorners = ref,
                heel = Point2D(centerX, h * 0.78),
                toe = Point2D(centerX, h * 0.42),
                widthMedial = Point2D(centerX - w * 0.08, h * 0.58),
                widthLateral = Point2D(centerX + w * 0.08, h * 0.58),
            )
        }
    }

    private fun defaultReferenceQuad(w: Double, h: Double): List<Point2D> = listOf(
        Point2D(w * 0.12, h * 0.18),
        Point2D(w * 0.88, h * 0.18),
        Point2D(w * 0.88, h * 0.82),
        Point2D(w * 0.12, h * 0.82),
    )
}
