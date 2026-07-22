package com.fitsense.ai.measurement

import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import javax.inject.Inject

/**
 * Real millimetre measurement from user-placed reference corners and foot landmarks.
 * Mirrors the web `computeRealMeasurement` contract.
 */
class ReferenceMeasurement @Inject constructor() {

    data class TapPoints(
        val refCorners: List<Point2D>,
        val heel: Point2D,
        val toe: Point2D,
        val widthMedial: Point2D?,
        val widthLateral: Point2D?,
        val foot: Foot,
        val imageWidthPx: Int,
        val imageHeightPx: Int,
    )

    data class ReferenceSanity(
        val aspectScore: Double,
        val scaleConsistencyScore: Double,
        val ok: Boolean,
        val issue: String?,
    )

    data class Result(
        val measurement: FootMeasurement,
        val sanity: ReferenceSanity,
        val pixelsPerMm: Double,
        val widthMeasured: Boolean,
    )

    fun measure(taps: TapPoints, reference: CalibrationReference): Result {
        require(reference != CalibrationReference.ARCORE_PLANE) {
            "AR plane mode is not supported for reference-card measurement."
        }
        require(taps.refCorners.size == 4) { "Need exactly 4 reference corners." }

        val ordered = sortCornersTopLeft(taps.refCorners)
        val topEdge = distance(ordered[0], ordered[1])
        val rightEdge = distance(ordered[1], ordered[2])
        val bottomEdge = distance(ordered[3], ordered[2])
        val leftEdge = distance(ordered[0], ordered[3])
        val horizontalPx = (topEdge + bottomEdge) / 2.0
        val verticalPx = (leftEdge + rightEdge) / 2.0
        val longMm = maxOf(reference.widthMm, reference.heightMm)
        val shortMm = minOf(reference.widthMm, reference.heightMm)
        val worldWidthMm = if (horizontalPx >= verticalPx) longMm else shortMm
        val worldHeightMm = if (horizontalPx >= verticalPx) shortMm else longMm

        val dst = listOf(
            Point2D(0.0, 0.0),
            Point2D(worldWidthMm, 0.0),
            Point2D(worldWidthMm, worldHeightMm),
            Point2D(0.0, worldHeightMm),
        )
        val H = Homography.compute(ordered, dst)

        val heelMm = Homography.apply(H, taps.heel)
        val toeMm = Homography.apply(H, taps.toe)
        val lengthMm = distance(heelMm, toeMm)

        val widthMeasured = taps.widthMedial != null && taps.widthLateral != null
        val widthMm = if (widthMeasured) {
            val medialMm = Homography.apply(H, taps.widthMedial!!)
            val lateralMm = Homography.apply(H, taps.widthLateral!!)
            distance(medialMm, lateralMm)
        } else {
            0.0
        }

        val pxPerMmTop = topEdge / worldWidthMm
        val pxPerMmBottom = bottomEdge / worldWidthMm
        val pxPerMmLeft = leftEdge / worldHeightMm
        val pxPerMmRight = rightEdge / worldHeightMm
        val pixelsPerMm = (pxPerMmTop + pxPerMmBottom + pxPerMmLeft + pxPerMmRight) / 4.0

        val sanity = computeSanity(
            pxPerMm = listOf(pxPerMmTop, pxPerMmBottom, pxPerMmLeft, pxPerMmRight),
            edgesPx = listOf(topEdge, bottomEdge, leftEdge, rightEdge),
            dims = worldWidthMm to worldHeightMm,
            imageWidthPx = taps.imageWidthPx,
            imageHeightPx = taps.imageHeightPx,
            ordered = ordered,
        )
        val dimensionIssue = validateDimensions(lengthMm, widthMm, widthMeasured)
        val issue = sanity.issue ?: dimensionIssue
        val finalSanity = sanity.copy(ok = issue == null, issue = issue)

        val confidence = computeConfidence(
            pixelsPerMm = pixelsPerMm,
            ordered = ordered,
            imageWidthPx = taps.imageWidthPx,
            imageHeightPx = taps.imageHeightPx,
            widthMeasured = widthMeasured,
            sanity = finalSanity,
        ).toFloat()

        val measurement = FootMeasurement(
            lengthMm = lengthMm,
            widthMm = widthMm,
            confidence = confidence,
            foot = taps.foot,
            calibration = reference,
            pixelsPerMm = pixelsPerMm,
        )
        return Result(measurement, finalSanity, pixelsPerMm, widthMeasured)
    }

    private fun computeSanity(
        pxPerMm: List<Double>,
        edgesPx: List<Double>,
        dims: Pair<Double, Double>,
        imageWidthPx: Int,
        imageHeightPx: Int,
        ordered: List<Point2D>,
    ): ReferenceSanity {
        val (widthMm, heightMm) = dims
        val expectedAspect = heightMm / widthMm
        val horiz = (edgesPx[0] + edgesPx[1]) / 2.0
        val vert = (edgesPx[2] + edgesPx[3]) / 2.0
        val observedAspect = if (horiz == 0.0 || vert == 0.0) 0.0
        else maxOf(horiz, vert) / minOf(horiz, vert)
        val expected = if (expectedAspect >= 1.0) expectedAspect else 1.0 / expectedAspect
        val aspectDelta = kotlin.math.abs(observedAspect - expected) / expected
        val aspectScore = clamp01(1.0 - aspectDelta / 0.25)

        val mean = pxPerMm.average()
        if (mean <= 0.0) {
            return ReferenceSanity(aspectScore, 0.0, false, "Reference quad has zero size — re-tap the corners.")
        }
        val variance = pxPerMm.map { (it - mean) * (it - mean) }.average()
        val cv = kotlin.math.sqrt(variance) / mean
        val scaleConsistencyScore = clamp01(1.0 - cv / 0.2)

        val frameArea = imageWidthPx.toLong() * imageHeightPx
        val areaPx = quadArea(ordered)
        val frameFraction = if (frameArea > 0) areaPx / frameArea else 0.0
        val fullyVisible = referenceHasFrameMargin(ordered, imageWidthPx, imageHeightPx)

        val issue = when {
            !mean.isFinite() || mean < 0.5 || mean > 100.0 ->
                "The reference produced an impossible scale. Reposition and retap all four corners."
            !fullyVisible ->
                "The reference touches or leaves the frame. Retake with all four edges visible."
            frameArea <= 0 || frameFraction < 0.05 ->
                "The reference is too small in the photo. Move the phone closer."
            aspectScore < 0.7 ->
                "The tapped corners don't match the chosen reference shape."
            scaleConsistencyScore < 0.7 ->
                "The camera angle looks steep. Shoot from straight above."
            else -> null
        }
        return ReferenceSanity(aspectScore, scaleConsistencyScore, issue == null, issue)
    }

    private fun validateDimensions(lengthMm: Double, widthMm: Double, widthMeasured: Boolean): String? {
        if (!lengthMm.isFinite() || lengthMm < 120.0 || lengthMm > 360.0) {
            return "Heel-to-toe length is implausible. Check heel and longest-toe points."
        }
        if (!widthMeasured) {
            return "Ball width must be measured. Mark both sides of the widest forefoot."
        }
        if (!widthMm.isFinite() || widthMm < 45.0 || widthMm > 160.0) {
            return "Ball width is implausible. Check both ball-of-foot landmarks."
        }
        val ratio = widthMm / lengthMm
        if (ratio < 0.25 || ratio > 0.55) {
            return "Width-to-length ratio is implausible. Correct the foot landmarks."
        }
        return null
    }

    private fun computeConfidence(
        pixelsPerMm: Double,
        ordered: List<Point2D>,
        imageWidthPx: Int,
        imageHeightPx: Int,
        widthMeasured: Boolean,
        sanity: ReferenceSanity,
    ): Double {
        var score = 0.4
        if (pixelsPerMm >= 3.0) score += 0.15 else if (pixelsPerMm >= 1.5) score += 0.07
        if (imageWidthPx > 0 && imageHeightPx > 0) {
            val ratio = quadArea(ordered) / (imageWidthPx.toDouble() * imageHeightPx)
            if (ratio in 0.05..0.6) score += 0.1
        }
        if (widthMeasured) score += 0.1
        score += 0.15 * sanity.aspectScore
        score += 0.1 * sanity.scaleConsistencyScore
        return score.coerceIn(0.0, 1.0)
    }

    private fun referenceHasFrameMargin(corners: List<Point2D>, widthPx: Int, heightPx: Int): Boolean {
        if (widthPx <= 0 || heightPx <= 0) return false
        val margin = maxOf(4.0, minOf(widthPx, heightPx) * 0.01)
        return corners.all { it.x >= margin && it.y >= margin && it.x <= widthPx - margin && it.y <= heightPx - margin }
    }

    private fun clamp01(v: Double): Double = v.coerceIn(0.0, 1.0)
}
