package com.fitsense.ai.measurement

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LandmarkDisagreementTest {
    @Test
    fun acceptsSmallAdjustments() {
        val seed = LandmarkDisagreement.ContourSeed(
            heel = Point2D(100.0, 400.0),
            toe = Point2D(100.0, 100.0),
            widthMedial = Point2D(60.0, 250.0),
            widthLateral = Point2D(140.0, 250.0),
        )
        // ~2 mm length nudge at 4 px/mm
        val report = LandmarkDisagreement.compare(
            seed = seed,
            heel = Point2D(100.0, 408.0),
            toe = Point2D(100.0, 100.0),
            widthMedial = Point2D(62.0, 250.0),
            widthLateral = Point2D(140.0, 250.0),
            pixelsPerMm = 4.0,
        )
        assertTrue(report.ok)
    }

    @Test
    fun rejectsLargeLengthDisagreement() {
        val seed = LandmarkDisagreement.ContourSeed(
            heel = Point2D(100.0, 400.0),
            toe = Point2D(100.0, 100.0),
            widthMedial = Point2D(60.0, 250.0),
            widthLateral = Point2D(140.0, 250.0),
        )
        // 80 px ≈ 20 mm at 4 px/mm
        val report = LandmarkDisagreement.compare(
            seed = seed,
            heel = Point2D(100.0, 480.0),
            toe = Point2D(100.0, 100.0),
            widthMedial = Point2D(60.0, 250.0),
            widthLateral = Point2D(140.0, 250.0),
            pixelsPerMm = 4.0,
        )
        assertFalse(report.ok)
        assertTrue(report.issue!!.contains("heel"))
    }
}
