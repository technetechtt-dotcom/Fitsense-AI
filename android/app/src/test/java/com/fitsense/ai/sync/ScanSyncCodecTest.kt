package com.fitsense.ai.sync

import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.ScanResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ScanSyncCodecTest {
    private fun foot(
        length: Double,
        width: Double,
        side: Foot,
    ) = FootMeasurement(
        lengthMm = length,
        widthMm = width,
        confidence = 0.85f,
        foot = side,
        calibration = CalibrationReference.A4_PAPER,
        pixelsPerMm = 3.2,
    )

    @Test
    fun encodeDecodePreservesBothFeet() {
        val scan = ScanResult(
            scanId = "scan_1",
            userId = "user_1",
            createdAtEpochMs = 1_700_000_000_000L,
            updatedAtEpochMs = 1_700_000_000_100L,
            revision = 3,
            leftFoot = foot(255.0, 96.0, Foot.LEFT),
            rightFoot = foot(257.0, 97.5, Foot.RIGHT),
            deviceModel = "Pixel 8",
            arcoreUsed = false,
        )
        val encoded = ScanSyncCodec.encodeScan(scan)
        val decoded = ScanSyncCodec.decodeScan(encoded)
        assertNotNull(decoded)
        assertEquals(255.0, decoded!!.leftFoot!!.lengthMm, 0.001)
        assertEquals(257.0, decoded.rightFoot!!.lengthMm, 0.001)
        assertEquals(Foot.LEFT, decoded.leftFoot!!.foot)
        assertEquals(CalibrationReference.A4_PAPER, decoded.rightFoot!!.calibration)
        assertEquals(3L, decoded.revision)
        assertEquals("Pixel 8", decoded.deviceModel)
    }

    @Test
    fun mergeDoesNotWipeLocalFeetWithFootlessRemote() {
        val local = ScanResult(
            scanId = "scan_1",
            userId = "user_1",
            revision = 2,
            updatedAtEpochMs = 100,
            leftFoot = foot(255.0, 96.0, Foot.LEFT),
            rightFoot = foot(257.0, 97.0, Foot.RIGHT),
        )
        val remote = ScanResult(
            scanId = "scan_1",
            userId = "user_1",
            revision = 2,
            updatedAtEpochMs = 200,
            leftFoot = null,
            rightFoot = null,
        )
        val merged = ScanSyncCodec.mergeScans(local, remote)
        assertNotNull(merged.leftFoot)
        assertNotNull(merged.rightFoot)
        assertEquals(255.0, merged.leftFoot!!.lengthMm, 0.001)
    }

    @Test
    fun mergePrefersHigherRevisionRemoteFeet() {
        val local = ScanResult(
            scanId = "scan_1",
            userId = "user_1",
            revision = 1,
            leftFoot = foot(250.0, 90.0, Foot.LEFT),
        )
        val remote = ScanResult(
            scanId = "scan_1",
            userId = "user_1",
            revision = 4,
            leftFoot = foot(260.0, 100.0, Foot.LEFT),
            rightFoot = foot(261.0, 101.0, Foot.RIGHT),
        )
        val merged = ScanSyncCodec.mergeScans(local, remote)
        assertEquals(260.0, merged.leftFoot!!.lengthMm, 0.001)
        assertEquals(261.0, merged.rightFoot!!.lengthMm, 0.001)
        assertEquals(4L, merged.revision)
    }

    @Test
    fun decodeRejectsMissingScanId() {
        val obj = ScanSyncCodec.encodeScan(
            ScanResult(scanId = "x", userId = "y"),
        )
        // Mutate via re-encode without scanId is awkward; assert null path via empty object
        assertNull(ScanSyncCodec.decodeScan(kotlinx.serialization.json.buildJsonObject { }))
        assertTrue(obj.containsKey("scanId"))
    }
}
