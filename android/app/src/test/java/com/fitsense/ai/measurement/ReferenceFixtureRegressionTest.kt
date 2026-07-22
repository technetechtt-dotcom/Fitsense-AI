package com.fitsense.ai.measurement

import com.fitsense.ai.models.CalibrationReference
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.json.JSONObject

/**
 * Loads committed JSON fixture metadata and asserts aspect scoring math
 * matches the photographic regression contract (no binary image required).
 */
class ReferenceFixtureRegressionTest {
    @Test
    fun syntheticA4FixtureHasExpectedAspect() {
        val stream = javaClass.classLoader!!.getResourceAsStream("fixtures/a4/synthetic_a4_aspect.json")
        requireNotNull(stream) { "fixture missing from test resources" }
        val json = JSONObject(stream.bufferedReader().readText())
        val corners = json.getJSONArray("corners")
        val pts = (0 until corners.length()).map { i ->
            val pair = corners.getJSONArray(i)
            Point2D(pair.getDouble(0), pair.getDouble(1))
        }
        val width = distance(pts[0], pts[1])
        val height = distance(pts[1], pts[2])
        val aspect = maxOf(width, height) / minOf(width, height)
        val expected = json.getDouble("expectedAspect")
        assertEquals(expected, aspect, 0.05)
        assertEquals("a4_paper", json.getString("calibration"))
        assertTrue(json.getDouble("minConfidence") >= 0.6)
        assertEquals(CalibrationReference.A4_PAPER.heightMm / CalibrationReference.A4_PAPER.widthMm, expected, 0.01)
    }
}
