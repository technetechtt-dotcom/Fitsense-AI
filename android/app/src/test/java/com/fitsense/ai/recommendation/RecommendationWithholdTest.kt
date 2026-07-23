package com.fitsense.ai.recommendation

import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RecommendationWithholdTest {
    private val engine = RecommendationEngine(ShoeCatalog())

    @Test
    fun withholdsRetailSizeWhenConfidenceIsLow() {
        val foot = FootMeasurement(
            lengthMm = 260.0,
            widthMm = 98.0,
            confidence = 0.4f,
            foot = Foot.RIGHT,
            calibration = CalibrationReference.A4_PAPER,
            pixelsPerMm = 3.0,
        )
        val rec = engine.recommend(foot)
        assertTrue(rec.sizeWithheld)
        assertEquals("", rec.uk)
        assertEquals("", rec.us)
        assertEquals("", rec.eu)
        assertTrue(rec.matches.isEmpty())
    }

    @Test
    fun publishesSizeWhenConfidenceIsAcceptable() {
        val foot = FootMeasurement(
            lengthMm = 260.0,
            widthMm = 98.0,
            confidence = 0.8f,
            foot = Foot.RIGHT,
            calibration = CalibrationReference.A4_PAPER,
            pixelsPerMm = 3.0,
        )
        val rec = engine.recommend(foot)
        assertTrue(!rec.sizeWithheld)
        assertTrue(rec.uk.isNotBlank())
        assertTrue(rec.eu.isNotBlank())
    }
}
