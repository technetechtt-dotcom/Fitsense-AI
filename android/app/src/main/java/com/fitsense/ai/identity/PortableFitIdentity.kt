package com.fitsense.ai.identity

import android.util.Base64
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.nio.charset.StandardCharsets

/**
 * Portable Fit Identity token (FSP1) — shareable between devices.
 *
 * **Unsigned.** Imported millimetres must never be treated as measured sizing
 * truth. Prefer [FitIdentityClient] recovery (`FSIR1.`) or merchant share
 * (`FSMS1.`) for trusted restore.
 */
object PortableFitIdentity {
    private const val SENTINEL = "FSP1."
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    @Serializable
    data class Payload(
        val v: Int = 1,
        val fitId: String,
        val l: Double? = null,
        val w: Double? = null,
        val wc: String = "regular",
        val ar: String = "unknown",
        val t: String = "unknown",
        val c: String = "standard",
        val m: String = "unknown",
        val fb: List<String> = emptyList(),
    )

    fun export(payload: Payload): String {
        val bytes = json.encodeToString(payload).toByteArray(StandardCharsets.UTF_8)
        val b64 = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        return SENTINEL + b64
    }

    fun import(token: String): Payload? {
        if (!token.startsWith(SENTINEL)) return null
        return runCatching {
            val raw = token.removePrefix(SENTINEL)
            val padded = raw + "=".repeat((4 - raw.length % 4) % 4)
            val bytes = Base64.decode(padded, Base64.URL_SAFE)
            json.decodeFromString<Payload>(String(bytes, StandardCharsets.UTF_8))
        }.getOrNull()?.takeIf { it.v == 1 && it.fitId.isNotBlank() }
    }
}
