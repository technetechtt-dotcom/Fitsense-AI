package com.fitsense.ai.measurement

import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HomographyTest {
    @Test
    fun identitySquareMapsCornersToMillimetres() {
        val src = listOf(
            Point2D(0.0, 0.0),
            Point2D(100.0, 0.0),
            Point2D(100.0, 141.0),
            Point2D(0.0, 141.0),
        )
        val dst = listOf(
            Point2D(0.0, 0.0),
            Point2D(210.0, 0.0),
            Point2D(210.0, 297.0),
            Point2D(0.0, 297.0),
        )
        val H = Homography.compute(src, dst)
        val mapped = Homography.apply(H, Point2D(50.0, 70.0))
        assertEquals(105.0, mapped.x, 1.0)
        // 70/141 * 297 ≈ 147.45 (not half of 297)
        assertEquals(147.45, mapped.y, 1.0)
    }
}

class ReferenceMeasurementTest {
    private val engine = ReferenceMeasurement()

    @Test
    fun a4ReferenceProducesPlausibleFootDimensions() {
        val result = engine.measure(
            ReferenceMeasurement.TapPoints(
                refCorners = listOf(
                    Point2D(100.0, 120.0),
                    Point2D(900.0, 130.0),
                    Point2D(880.0, 1500.0),
                    Point2D(120.0, 1480.0),
                ),
                heel = Point2D(500.0, 1300.0),
                toe = Point2D(500.0, 700.0),
                widthMedial = Point2D(420.0, 980.0),
                widthLateral = Point2D(580.0, 980.0),
                foot = Foot.RIGHT,
                imageWidthPx = 1080,
                imageHeightPx = 1920,
            ),
            CalibrationReference.A4_PAPER,
        )
        assertTrue(result.sanity.ok)
        assertTrue(result.measurement.lengthMm in 120.0..360.0)
        assertTrue(result.measurement.widthMm in 45.0..160.0)
        assertTrue(result.widthMeasured)
    }

    @Test
    fun rejectsMissingWidthLandmarks() {
        val result = engine.measure(
            ReferenceMeasurement.TapPoints(
                refCorners = listOf(
                    Point2D(100.0, 120.0),
                    Point2D(900.0, 130.0),
                    Point2D(880.0, 1500.0),
                    Point2D(120.0, 1480.0),
                ),
                heel = Point2D(500.0, 1300.0),
                toe = Point2D(500.0, 700.0),
                widthMedial = null,
                widthLateral = null,
                foot = Foot.LEFT,
                imageWidthPx = 1080,
                imageHeightPx = 1920,
            ),
            CalibrationReference.CREDIT_CARD,
        )
        assertTrue(!result.sanity.ok)
    }
}

class CalibrationEngineTest {
    private val engine = CalibrationEngine()

    @Test
    fun cardCalibrationUsesKnownAspectRatio() {
        val cal = engine.fromReferenceCard(430.0, 270.0, CalibrationReference.CREDIT_CARD)
        assertTrue(cal.pixelsPerMm > 0.0)
        assertTrue(cal.confidence > 0.5f)
    }
}

class MeasurementValidatorTest {
    private val validator = MeasurementValidator()

    @Test
    fun acceptsHighConfidenceMeasuredWidth() {
        val measurement = com.fitsense.ai.models.FootMeasurement(
            lengthMm = 260.0,
            widthMm = 98.0,
            confidence = 0.82f,
            foot = Foot.RIGHT,
            calibration = CalibrationReference.A4_PAPER,
            pixelsPerMm = 3.2,
        )
        val sanity = ReferenceMeasurement.ReferenceSanity(0.9, 0.9, true, null)
        val result = validator.validate(measurement, sanity, widthMeasured = true)
        assertTrue(result.accepted)
    }
}
