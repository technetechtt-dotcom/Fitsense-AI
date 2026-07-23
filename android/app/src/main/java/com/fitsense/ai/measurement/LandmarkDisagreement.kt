package com.fitsense.ai.measurement

/**
 * Compares user-confirmed foot landmarks against the auto-detected contour seed.
 * Large disagreement means the user and CV disagree — force retake rather than
 * publishing contested millimetres.
 */
object LandmarkDisagreement {

    data class ContourSeed(
        val heel: Point2D,
        val toe: Point2D,
        val widthMedial: Point2D,
        val widthLateral: Point2D,
    )

    data class Report(
        val lengthDeltaMm: Double,
        val widthDeltaMm: Double,
        val ok: Boolean,
        val issue: String?,
    )

    /** Max heel–toe length delta (mm) before we require a retake. */
    const val MAX_LENGTH_DELTA_MM = 12.0

    /** Max ball-width delta (mm) before we require a retake. */
    const val MAX_WIDTH_DELTA_MM = 8.0

    fun compare(
        seed: ContourSeed,
        heel: Point2D,
        toe: Point2D,
        widthMedial: Point2D,
        widthLateral: Point2D,
        pixelsPerMm: Double,
    ): Report {
        if (!pixelsPerMm.isFinite() || pixelsPerMm <= 0.0) {
            return Report(0.0, 0.0, false, "Cannot compare landmarks without a valid scale.")
        }
        val seedLengthPx = distance(seed.heel, seed.toe)
        val userLengthPx = distance(heel, toe)
        val seedWidthPx = distance(seed.widthMedial, seed.widthLateral)
        val userWidthPx = distance(widthMedial, widthLateral)
        val lengthDeltaMm = kotlin.math.abs(seedLengthPx - userLengthPx) / pixelsPerMm
        val widthDeltaMm = kotlin.math.abs(seedWidthPx - userWidthPx) / pixelsPerMm

        val issue = when {
            lengthDeltaMm > MAX_LENGTH_DELTA_MM ->
                "Manual heel–toe differs from auto-detect by ${"%.1f".format(lengthDeltaMm)} mm. Retake or re-mark carefully."
            widthDeltaMm > MAX_WIDTH_DELTA_MM ->
                "Manual ball width differs from auto-detect by ${"%.1f".format(widthDeltaMm)} mm. Retake or re-mark carefully."
            else -> null
        }
        return Report(
            lengthDeltaMm = lengthDeltaMm,
            widthDeltaMm = widthDeltaMm,
            ok = issue == null,
            issue = issue,
        )
    }
}
