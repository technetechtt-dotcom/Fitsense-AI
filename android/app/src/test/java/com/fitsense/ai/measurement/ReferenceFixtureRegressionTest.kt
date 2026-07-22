package com.fitsense.ai.measurement

import com.fitsense.ai.models.CalibrationReference
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Loads committed JSON fixture metadata and asserts aspect scoring math
 * matches the photographic regression contract (no binary image required).
 *
 * Uses kotlinx.serialization — Android `org.json` stubs throw on JVM unit tests.
 */
class ReferenceFixtureRegressionTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    private data class Fixture(
        val corners: List<List<Double>>,
        val expectedAspect: Double,
        val calibration: String,
        val minConfidence: Double,
    )

    @Test
    fun syntheticA4FixtureHasExpectedAspect() {
        val stream = javaClass.classLoader!!.getResourceAsStream("fixtures/a4/synthetic_a4_aspect.json")
        requireNotNull(stream) { "fixture missing from test resources" }
        val fixture = json.decodeFromString<Fixture>(stream.bufferedReader().readText())
        require(fixture.corners.size == 4) { "need 4 corners" }
        val pts = fixture.corners.map { pair ->
            Point2D(pair[0], pair[1])
        }
        val width = distance(pts[0], pts[1])
        val height = distance(pts[1], pts[2])
        val aspect = maxOf(width, height) / minOf(width, height)
        assertEquals(fixture.expectedAspect, aspect, 0.05)
        assertEquals("a4_paper", fixture.calibration)
        assertTrue(fixture.minConfidence >= 0.6)
        assertEquals(
            CalibrationReference.A4_PAPER.heightMm / CalibrationReference.A4_PAPER.widthMm,
            fixture.expectedAspect,
            0.01,
        )
    }
}
