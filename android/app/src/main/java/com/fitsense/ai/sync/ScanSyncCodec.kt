package com.fitsense.ai.sync

import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.ScanResult
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.floatOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put

/**
 * Wire codec for cloud scan JSON (encode/decode + merge).
 * Keeps millimetre feet intact across push/pull — never invents dimensions.
 */
object ScanSyncCodec {

    fun encodeScan(scan: ScanResult): JsonObject = buildJsonObject {
        put("scanId", scan.scanId)
        put("userId", scan.userId)
        put("createdAtEpochMs", scan.createdAtEpochMs)
        put("updatedAtEpochMs", scan.updatedAtEpochMs)
        put("revision", scan.revision)
        put("arcoreUsed", scan.arcoreUsed)
        scan.deviceModel?.let { put("deviceModel", it) }
        scan.leftFoot?.let { put("leftFoot", encodeFoot(it)) }
        scan.rightFoot?.let { put("rightFoot", encodeFoot(it)) }
    }

    fun decodeScan(obj: JsonObject): ScanResult? {
        val scanId = obj["scanId"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["userId"]?.jsonPrimitive?.contentOrNull ?: return null
        val created = obj["createdAtEpochMs"]?.jsonPrimitive?.longOrNull
            ?: System.currentTimeMillis()
        val updated = obj["updatedAtEpochMs"]?.jsonPrimitive?.longOrNull ?: created
        val revision = obj["revision"]?.jsonPrimitive?.longOrNull ?: 1L
        return ScanResult(
            scanId = scanId,
            userId = userId,
            createdAtEpochMs = created,
            updatedAtEpochMs = updated,
            revision = revision,
            arcoreUsed = obj["arcoreUsed"]?.jsonPrimitive?.booleanOrNull ?: false,
            deviceModel = obj["deviceModel"]?.jsonPrimitive?.contentOrNull,
            leftFoot = obj["leftFoot"]?.jsonObject?.let { decodeFoot(it) },
            rightFoot = obj["rightFoot"]?.jsonObject?.let { decodeFoot(it) },
        )
    }

    /**
     * Conflict merge: never replace a footed local scan with a footless remote.
     * Prefer higher revision, then newer updatedAt, then richer feet.
     */
    fun mergeScans(local: ScanResult?, remote: ScanResult): ScanResult {
        if (local == null) return remote
        val localRich = footRichness(local)
        val remoteRich = footRichness(remote)
        if (localRich > 0 && remoteRich == 0) return local
        if (remote.revision > local.revision) {
            return remote.copy(
                leftFoot = remote.leftFoot ?: local.leftFoot,
                rightFoot = remote.rightFoot ?: local.rightFoot,
                recommendation = remote.recommendation ?: local.recommendation,
                deviceModel = remote.deviceModel ?: local.deviceModel,
            )
        }
        if (local.revision > remote.revision) {
            return local.copy(
                leftFoot = local.leftFoot ?: remote.leftFoot,
                rightFoot = local.rightFoot ?: remote.rightFoot,
                recommendation = local.recommendation ?: remote.recommendation,
                deviceModel = local.deviceModel ?: remote.deviceModel,
            )
        }
        // Same revision — compare updated timestamps, keep richer feet.
        val preferRemote = remote.updatedAtEpochMs >= local.updatedAtEpochMs
        return if (preferRemote) {
            remote.copy(
                leftFoot = remote.leftFoot ?: local.leftFoot,
                rightFoot = remote.rightFoot ?: local.rightFoot,
                recommendation = remote.recommendation ?: local.recommendation,
                deviceModel = remote.deviceModel ?: local.deviceModel,
                revision = maxOf(local.revision, remote.revision),
            )
        } else {
            local.copy(
                leftFoot = local.leftFoot ?: remote.leftFoot,
                rightFoot = local.rightFoot ?: remote.rightFoot,
                recommendation = local.recommendation ?: remote.recommendation,
                deviceModel = local.deviceModel ?: remote.deviceModel,
                revision = maxOf(local.revision, remote.revision),
            )
        }.let { merged ->
            // If remote is richer despite older stamp, take remote feet.
            if (remoteRich > localRich) {
                merged.copy(
                    leftFoot = remote.leftFoot ?: merged.leftFoot,
                    rightFoot = remote.rightFoot ?: merged.rightFoot,
                )
            } else merged
        }
    }

    fun footRichness(scan: ScanResult): Int {
        var n = 0
        if (scan.leftFoot != null && scan.leftFoot.lengthMm > 0) n++
        if (scan.rightFoot != null && scan.rightFoot.lengthMm > 0) n++
        return n
    }

    private fun encodeFoot(foot: FootMeasurement): JsonObject = buildJsonObject {
        put("lengthMm", foot.lengthMm)
        put("widthMm", foot.widthMm)
        put("confidence", foot.confidence.toDouble())
        put(
            "foot",
            when (foot.foot) {
                Foot.LEFT -> "left"
                Foot.RIGHT -> "right"
                Foot.UNKNOWN -> "unknown"
            },
        )
        put(
            "calibration",
            when (foot.calibration) {
                CalibrationReference.A4_PAPER -> "a4_paper"
                CalibrationReference.CREDIT_CARD -> "credit_card"
                CalibrationReference.ARCORE_PLANE -> "arcore_plane"
            },
        )
        put("pixelsPerMm", foot.pixelsPerMm)
        foot.archHeightMm?.let { put("archHeightMm", it) }
    }

    private fun decodeFoot(obj: JsonObject): FootMeasurement? {
        val length = obj["lengthMm"]?.jsonPrimitive?.doubleOrNull ?: return null
        val width = obj["widthMm"]?.jsonPrimitive?.doubleOrNull ?: return null
        if (length <= 0.0 || width <= 0.0) return null
        val confidence = obj["confidence"]?.jsonPrimitive?.floatOrNull
            ?: obj["confidence"]?.jsonPrimitive?.doubleOrNull?.toFloat()
            ?: 0f
        val foot = when (obj["foot"]?.jsonPrimitive?.contentOrNull?.lowercase()) {
            "left" -> Foot.LEFT
            "right" -> Foot.RIGHT
            else -> Foot.UNKNOWN
        }
        val calibration = when (obj["calibration"]?.jsonPrimitive?.contentOrNull?.lowercase()) {
            "a4_paper" -> CalibrationReference.A4_PAPER
            "credit_card" -> CalibrationReference.CREDIT_CARD
            "arcore_plane" -> CalibrationReference.ARCORE_PLANE
            else -> CalibrationReference.A4_PAPER
        }
        return FootMeasurement(
            lengthMm = length,
            widthMm = width,
            archHeightMm = obj["archHeightMm"]?.jsonPrimitive?.doubleOrNull,
            confidence = confidence,
            foot = foot,
            calibration = calibration,
            pixelsPerMm = obj["pixelsPerMm"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        )
    }
}
