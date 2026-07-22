package com.fitsense.ai.auth

import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.local.SecureDeviceCredentialStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Challenge-response device auth against FitSense API — mirrors web
 * `src/lib/cloud/auth.ts`. Credentials live in [SecureDeviceCredentialStore];
 * access tokens stay in memory only.
 */
@Singleton
class DeviceAuthClient @Inject constructor(
    private val credentialStore: SecureDeviceCredentialStore,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val mutex = Mutex()
    @Volatile private var accessToken: String? = null

    suspend fun ensureAccessToken(): String? = withContext(Dispatchers.IO) {
        mutex.withLock {
            accessToken?.let { return@withLock it }
            val base = ApiConfig.baseUrl ?: return@withLock null
            var creds = credentialStore.readDeviceCredentials()
            if (creds == null) {
                creds = register(base) ?: return@withLock null
                credentialStore.writeDeviceCredentials(creds.deviceId, creds.deviceSecret)
            }
            val refresh = credentialStore.readRefreshToken()
            if (refresh != null) {
                val rotated = refresh(base, refresh)
                if (rotated != null) {
                    accessToken = rotated.accessToken
                    credentialStore.writeRefreshToken(rotated.refreshToken)
                    return@withLock rotated.accessToken
                }
            }
            val minted = mint(base, creds.deviceId, creds.deviceSecret) ?: return@withLock null
            accessToken = minted.accessToken
            credentialStore.writeRefreshToken(minted.refreshToken)
            minted.accessToken
        }
    }

    suspend fun clearSession() = withContext(Dispatchers.IO) {
        mutex.withLock {
            accessToken = null
            credentialStore.clear()
        }
    }

    private fun register(base: String): SecureDeviceCredentialStore.DeviceCredentials? {
        val conn = open("$base/v1/auth/devices/register", "POST")
        conn.doOutput = true
        conn.outputStream.use { it.write("{}".toByteArray()) }
        if (conn.responseCode != 201) return null
        val body = json.decodeFromString<RegisterResponse>(readBody(conn))
        return SecureDeviceCredentialStore.DeviceCredentials(body.deviceId, body.deviceSecret)
    }

    private fun mint(
        base: String,
        deviceId: String,
        deviceSecret: String,
    ): TokenPair? {
        val challengeConn = open("$base/v1/auth/challenge", "POST")
        challengeConn.doOutput = true
        challengeConn.outputStream.use {
            it.write(json.encodeToString(ChallengeRequest(deviceId)).toByteArray())
        }
        if (challengeConn.responseCode !in 200..299) return null
        val challenge = json.decodeFromString<ChallengeResponse>(readBody(challengeConn))
        val proof = deviceProof(deviceSecret, challenge.nonce)
        val tokenConn = open("$base/v1/auth/token", "POST")
        tokenConn.doOutput = true
        tokenConn.outputStream.use {
            it.write(
                json.encodeToString(
                    TokenRequest(
                        deviceId = deviceId,
                        challengeId = challenge.challengeId,
                        nonce = challenge.nonce,
                        proof = proof,
                    ),
                ).toByteArray(),
            )
        }
        if (tokenConn.responseCode !in 200..299) return null
        return json.decodeFromString(readBody(tokenConn))
    }

    private fun refresh(base: String, refreshToken: String): TokenPair? {
        val conn = open("$base/v1/auth/refresh", "POST")
        conn.doOutput = true
        conn.outputStream.use {
            it.write(json.encodeToString(RefreshRequest(refreshToken)).toByteArray())
        }
        if (conn.responseCode !in 200..299) return null
        return json.decodeFromString(readBody(conn))
    }

    private fun deviceProof(deviceSecret: String, nonce: String): String {
        val secretHash = sha256Hex(deviceSecret)
        return sha256Hex("$secretHash:$nonce")
    }

    private fun sha256Hex(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun open(url: String, method: String): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            connectTimeout = 15_000
            readTimeout = 15_000
        }

    private fun readBody(conn: HttpURLConnection): String {
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        return stream?.bufferedReader()?.use { it.readText() } ?: ""
    }

    @Serializable private data class RegisterResponse(val deviceId: String, val deviceSecret: String)
    @Serializable private data class ChallengeRequest(val deviceId: String)
    @Serializable private data class ChallengeResponse(val challengeId: String, val nonce: String)
    @Serializable private data class TokenRequest(
        val deviceId: String,
        val challengeId: String,
        val nonce: String,
        val proof: String,
    )
    @Serializable private data class RefreshRequest(val refreshToken: String)
    @Serializable private data class TokenPair(val accessToken: String, val refreshToken: String)
}
