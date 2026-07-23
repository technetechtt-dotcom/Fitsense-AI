package com.fitsense.ai.identity

import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.auth.DeviceAuthClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/** Issues and redeems server-side Fit Identity recovery codes. */
@Singleton
class FitIdentityClient @Inject constructor(
    private val authClient: DeviceAuthClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    data class IssueResponse(
        val recoveryCode: String,
        val expiresAtEpochMs: Long,
        val fitId: String,
    )

    @Serializable
    data class RecoverResponse(
        val fitProfile: JsonObject,
        val fitId: String,
    )

    @Serializable
    private data class IssueBody(val fitProfile: JsonObject)

    @Serializable
    private data class RecoverBody(val recoveryCode: String)

    @Serializable
    data class ShareIssueResponse(
        val grantId: String,
        val shareToken: String,
        val expiresAtEpochMs: Long,
        val orgId: String,
        val purpose: String,
    )

    @Serializable
    private data class ShareIssueBody(
        val orgId: String,
        val fitProfile: JsonObject,
        val purpose: String = "sizing",
    )

    suspend fun issueRecoveryCode(fitProfile: JsonObject): IssueResponse? =
        withContext(Dispatchers.IO) {
            val base = ApiConfig.baseUrl ?: return@withContext null
            val token = authClient.ensureAccessToken() ?: return@withContext null
            val conn = open("$base/v1/fit-identity/recovery-codes", "POST", token)
            conn.doOutput = true
            conn.outputStream.use {
                it.write(json.encodeToString(IssueBody(fitProfile)).toByteArray())
            }
            if (conn.responseCode !in 200..299) return@withContext null
            json.decodeFromString(readBody(conn))
        }

    suspend fun recover(recoveryCode: String): RecoverResponse? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val conn = open("$base/v1/fit-identity/recover", "POST", null)
        conn.doOutput = true
        conn.outputStream.use {
            it.write(json.encodeToString(RecoverBody(recoveryCode.trim())).toByteArray())
        }
        if (conn.responseCode !in 200..299) return@withContext null
        json.decodeFromString(readBody(conn))
    }

    suspend fun createShareGrant(
        orgId: String,
        fitProfile: JsonObject,
        purpose: String = "in-store-sizing",
    ): ShareIssueResponse? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val token = authClient.ensureAccessToken() ?: return@withContext null
        val conn = open("$base/v1/fit-identity/share-grants", "POST", token)
        conn.doOutput = true
        conn.outputStream.use {
            it.write(json.encodeToString(ShareIssueBody(orgId, fitProfile, purpose)).toByteArray())
        }
        if (conn.responseCode !in 200..299) return@withContext null
        json.decodeFromString(readBody(conn))
    }

    private fun open(url: String, method: String, bearer: String?): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            if (bearer != null) setRequestProperty("Authorization", "Bearer $bearer")
            connectTimeout = 15_000
            readTimeout = 15_000
        }

    private fun readBody(conn: HttpURLConnection): String {
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        return stream?.bufferedReader()?.use { it.readText() } ?: ""
    }
}
