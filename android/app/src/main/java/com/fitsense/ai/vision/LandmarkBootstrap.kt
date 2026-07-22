package com.fitsense.ai.vision

import android.graphics.Bitmap
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import javax.inject.Inject

/**
 * Seeds markup landmarks when auto-detection is uncertain.
 * Fallback points always set [LandmarkSource.FALLBACK] so the UI can require
 * explicit confirmation before millimetres are accepted.
 */
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
        val refSource: LandmarkSource,
        val footSource: LandmarkSource,
        val refConfidence: Double?,
    ) {
        val requiresFallbackConfirmation: Boolean
            get() = refSource == LandmarkSource.FALLBACK || footSource == LandmarkSource.FALLBACK
    }

    fun bootstrap(
        bitmap: Bitmap,
        foot: Foot,
        calibration: CalibrationReference,
    ): Bootstrap {
        val w = bitmap.width.toDouble()
        val h = bitmap.height.toDouble()
        val detected = referenceDetector.detectCorners(bitmap, calibration)
        val (ref, refSource, refConf) = if (detected != null) {
            Triple(detected.corners, LandmarkSource.DETECTED, detected.confidence)
        } else {
            Triple(defaultReferenceQuad(w, h), LandmarkSource.FALLBACK, null)
        }
        val contour = contourDetector.detect(bitmap)
        return if (contour != null) {
            Bootstrap(
                refCorners = ref,
                heel = Point2D(contour.heel.x, contour.heel.y),
                toe = Point2D(contour.toe.x, contour.toe.y),
                widthMedial = Point2D(contour.widthA.x, contour.widthA.y),
                widthLateral = Point2D(contour.widthB.x, contour.widthB.y),
                refSource = refSource,
                footSource = LandmarkSource.DETECTED,
                refConfidence = refConf,
            )
        } else {
            val centerX = w * 0.5
            Bootstrap(
                refCorners = ref,
                heel = Point2D(centerX, h * 0.78),
                toe = Point2D(centerX, h * 0.42),
                widthMedial = Point2D(centerX - w * 0.08, h * 0.58),
                widthLateral = Point2D(centerX + w * 0.08, h * 0.58),
                refSource = refSource,
                footSource = LandmarkSource.FALLBACK,
                refConfidence = refConf,
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
