package com.fitsense.ai.handoff

import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.SizeRecommendation
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Client for signed, one-time handoff sessions against the FitSense API.
 *
 * Desktop/web creates the session; the phone only publishes with the
 * publish Bearer from the QR. Consume stays on the desktop.
 */
@Singleton
class HandoffClient @Inject constructor() {
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    data class SessionResponse(
        val sessionId: String,
        val publishToken: String,
        val consumeToken: String,
        val expiresAtEpochMs: Long,
    )

    @Serializable
    data class HandoffPayload(
        val v: Int = 1,
        val completedAtEpochMs: Long,
        val size: HandoffSize,
        val scan: HandoffScan,
    )

    @Serializable
    data class HandoffSize(
        val uk: String,
        val us: String,
        val eu: String,
        val mondopointMm: Int,
        val fitScore: Double = 0.0,
        val preferred: String = "uk",
        val measurementConfidence: Double? = null,
        val recommendationConfidence: Double? = null,
    )

    @Serializable
    data class HandoffScan(
        val scanId: String,
        val lengthMm: Double,
        val widthMm: Double,
        val widthToLengthRatio: Double,
        val capturedAtEpochMs: Long,
        val measurementConfidence: Double? = null,
    )

    @Serializable
    private data class PublishBody(val payload: HandoffPayload)

    @Serializable
    private data class ConsumeBody(val payload: HandoffPayload? = null)

    fun createSession(baseUrl: String): SessionResponse {
        val conn = open("$baseUrl/v1/handoff/sessions", "POST")
        conn.doOutput = true
        conn.outputStream.use { it.write("{}".toByteArray()) }
        return json.decodeFromString(readBody(conn))
    }

    fun publish(baseUrl: String, sessionId: String, publishToken: String, payload: HandoffPayload): Boolean {
        val conn = open("$baseUrl/v1/handoff/$sessionId", "PUT")
        conn.setRequestProperty("Authorization", "Bearer $publishToken")
        conn.doOutput = true
        conn.outputStream.use { it.write(json.encodeToString(PublishBody(payload)).toByteArray()) }
        return conn.responseCode == HttpURLConnection.HTTP_NO_CONTENT
    }

    fun consume(baseUrl: String, sessionId: String, consumeToken: String): HandoffPayload? {
        val conn = open("$baseUrl/v1/handoff/$sessionId/consume", "POST")
        conn.setRequestProperty("Authorization", "Bearer $consumeToken")
        conn.doOutput = true
        conn.outputStream.use { it.write("{}".toByteArray()) }
        if (conn.responseCode !in 200..299) return null
        return json.decodeFromString<ConsumeBody>(readBody(conn)).payload
    }

    fun cancel(baseUrl: String, sessionId: String, consumeToken: String): Boolean {
        val conn = open("$baseUrl/v1/handoff/$sessionId", "DELETE")
        conn.setRequestProperty("Authorization", "Bearer $consumeToken")
        return conn.responseCode == HttpURLConnection.HTTP_NO_CONTENT
    }

    fun buildPayload(
        scanId: String,
        measurement: FootMeasurement,
        recommendation: SizeRecommendation,
    ): HandoffPayload = HandoffPayload(
        completedAtEpochMs = System.currentTimeMillis(),
        size = HandoffSize(
            uk = recommendation.uk,
            us = recommendation.us,
            eu = recommendation.eu,
            mondopointMm = recommendation.mondopointMm,
            measurementConfidence = measurement.confidence.toDouble(),
        ),
        scan = HandoffScan(
            scanId = scanId,
            lengthMm = measurement.lengthMm,
            widthMm = measurement.widthMm,
            widthToLengthRatio = measurement.widthToLengthRatio,
            capturedAtEpochMs = System.currentTimeMillis(),
            measurementConfidence = measurement.confidence.toDouble(),
        ),
    )

    private fun open(url: String, method: String): HttpURLConnection {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            connectTimeout = 15_000
            readTimeout = 15_000
        }
        return conn
    }

    private fun readBody(conn: HttpURLConnection): String {
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        return stream?.bufferedReader()?.use { it.readText() } ?: ""
    }
}
