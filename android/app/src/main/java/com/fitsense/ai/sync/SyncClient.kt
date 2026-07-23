package com.fitsense.ai.sync

import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.auth.DeviceAuthClient
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.ScanResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Cloud sync client for `/v1/sync` endpoints. Requires prior consent in the UI layer;
 * this class only performs HTTP when [ApiConfig] is configured and auth works.
 */
@Singleton
class SyncClient @Inject constructor(
    private val authClient: DeviceAuthClient,
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    @Serializable
    data class CloudPull(
        val fitProfile: JsonElement? = null,
        val fitEvents: List<JsonElement> = emptyList(),
        val scans: List<JsonElement> = emptyList(),
    )

    suspend fun pull(): CloudPull? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val token = authClient.ensureAccessToken() ?: return@withContext null
        val conn = open("$base/v1/sync", "GET", token)
        if (conn.responseCode !in 200..299) return@withContext null
        json.decodeFromString(readBody(conn))
    }

    suspend fun pushScan(scan: ScanResult): Boolean = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext false
        val token = authClient.ensureAccessToken() ?: return@withContext false
        val body = scanToJson(scan)
        val conn = open("$base/v1/sync/scans/${scan.scanId}", "PUT", token)
        conn.doOutput = true
        conn.setRequestProperty("Idempotency-Key", "scan:${scan.scanId}")
        conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        when (conn.responseCode) {
            HttpURLConnection.HTTP_NO_CONTENT, HttpURLConnection.HTTP_OK -> true
            401 -> {
                authClient.invalidateAccessToken()
                false
            }
            else -> false
        }
    }

    suspend fun pushScanJson(scanId: String, payloadJson: String): Boolean = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext false
        val token = authClient.ensureAccessToken() ?: return@withContext false
        val conn = open("$base/v1/sync/scans/$scanId", "PUT", token)
        conn.doOutput = true
        conn.setRequestProperty("Idempotency-Key", "scan:$scanId")
        conn.outputStream.use { it.write(payloadJson.toByteArray(Charsets.UTF_8)) }
        when (conn.responseCode) {
            HttpURLConnection.HTTP_NO_CONTENT, HttpURLConnection.HTTP_OK -> true
            401 -> {
                authClient.invalidateAccessToken()
                false
            }
            else -> false
        }
    }

    suspend fun pushFitProfileJson(payloadJson: String): Boolean = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext false
        val token = authClient.ensureAccessToken() ?: return@withContext false
        val conn = open("$base/v1/sync/fit-profile", "PUT", token)
        conn.doOutput = true
        conn.setRequestProperty("Idempotency-Key", "fit-profile")
        conn.outputStream.use { it.write(payloadJson.toByteArray(Charsets.UTF_8)) }
        when (conn.responseCode) {
            HttpURLConnection.HTTP_NO_CONTENT, HttpURLConnection.HTTP_OK -> true
            401 -> {
                authClient.invalidateAccessToken()
                false
            }
            else -> false
        }
    }

    fun encodeScan(scan: ScanResult): String = scanToJson(scan)

    fun encodeFitProfile(
        userId: String,
        cachedLengthMm: Double?,
        cachedWidthMm: Double?,
        favouriteBrands: List<String>,
    ): String {
        val now = System.currentTimeMillis()
        return json.encodeToString(
            JsonObject.serializer(),
            buildJsonObject {
                put("fitId", userId)
                put("userId", userId)
                put("version", 1)
                put("createdAtEpochMs", now)
                put("updatedAtEpochMs", now)
                put("widthClass", widthClassFor(cachedLengthMm, cachedWidthMm))
                put("archHeight", "unknown")
                put("toeShape", "unknown")
                put("comfortFit", "standard")
                put("preferredMidsoleFeel", "unknown")
                put(
                    "favouriteBrands",
                    kotlinx.serialization.json.JsonArray(
                        favouriteBrands.take(100).map { kotlinx.serialization.json.JsonPrimitive(it) },
                    ),
                )
                cachedLengthMm?.let { put("cachedFootLengthMm", it) }
                cachedWidthMm?.let { put("cachedFootWidthMm", it) }
            },
        )
    }

    private fun widthClassFor(lengthMm: Double?, widthMm: Double?): String {
        if (lengthMm == null || widthMm == null || lengthMm <= 0) return "regular"
        val ratio = widthMm / lengthMm
        return when {
            ratio < 0.37 -> "narrow"
            ratio > 0.45 -> "wide"
            else -> "regular"
        }
    }

    suspend fun deleteScan(scanId: String): Boolean = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext false
        val token = authClient.ensureAccessToken() ?: return@withContext false
        val conn = open("$base/v1/sync/scans/$scanId", "DELETE", token)
        when (conn.responseCode) {
            HttpURLConnection.HTTP_NO_CONTENT, HttpURLConnection.HTTP_OK -> true
            401 -> {
                authClient.invalidateAccessToken()
                false
            }
            else -> false
        }
    }

    suspend fun eraseAll(): Boolean = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext false
        val token = authClient.ensureAccessToken() ?: return@withContext false
        val conn = open("$base/v1/sync", "DELETE", token)
        conn.responseCode == HttpURLConnection.HTTP_NO_CONTENT
    }

    suspend fun exportJson(): String? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val token = authClient.ensureAccessToken() ?: return@withContext null
        val conn = open("$base/v1/sync/export", "GET", token)
        if (conn.responseCode !in 200..299) return@withContext null
        readBody(conn)
    }

    private fun scanToJson(scan: ScanResult): String {
        val payload = buildJsonObject {
            put("scanId", scan.scanId)
            put("userId", scan.userId)
            put("createdAtEpochMs", scan.createdAtEpochMs)
            put("arcoreUsed", scan.arcoreUsed)
            scan.leftFoot?.let { foot ->
                put(
                    "leftFoot",
                    buildJsonObject {
                        put("lengthMm", foot.lengthMm)
                        put("widthMm", foot.widthMm)
                        put("confidence", foot.confidence.toDouble())
                        put("foot", "left")
                        put("calibration", when (foot.calibration) {
                            CalibrationReference.A4_PAPER -> "a4_paper"
                            CalibrationReference.CREDIT_CARD -> "credit_card"
                            CalibrationReference.ARCORE_PLANE -> "arcore_plane"
                        })
                        put("pixelsPerMm", foot.pixelsPerMm)
                    },
                )
            }
            scan.rightFoot?.let { foot ->
                put(
                    "rightFoot",
                    buildJsonObject {
                        put("lengthMm", foot.lengthMm)
                        put("widthMm", foot.widthMm)
                        put("confidence", foot.confidence.toDouble())
                        put("foot", "right")
                        put("calibration", when (foot.calibration) {
                            CalibrationReference.A4_PAPER -> "a4_paper"
                            CalibrationReference.CREDIT_CARD -> "credit_card"
                            CalibrationReference.ARCORE_PLANE -> "arcore_plane"
                        })
                        put("pixelsPerMm", foot.pixelsPerMm)
                    },
                )
            }
        }
        return json.encodeToString(JsonObject.serializer(), payload)
    }

    private fun open(url: String, method: String, bearer: String): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Authorization", "Bearer $bearer")
            connectTimeout = 15_000
            readTimeout = 15_000
        }

    private fun readBody(conn: HttpURLConnection): String {
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        return stream?.bufferedReader()?.use { it.readText() } ?: ""
    }
}
