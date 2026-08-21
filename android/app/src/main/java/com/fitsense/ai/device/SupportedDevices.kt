package com.fitsense.ai.device

import android.content.Context
import org.json.JSONObject

/**
 * Limited launch allowlist — assets/supported-devices.json.
 * Uncertified devices may still measure; UI should warn, never invent mm.
 */
object SupportedDevices {
    data class Evaluation(
        val status: String,
        val launchLimited: Boolean,
        val message: String,
    )

    fun evaluate(context: Context, manufacturer: String?, model: String?): Evaluation {
        val mfr = manufacturer?.trim().orEmpty().lowercase()
        val mdl = model?.trim().orEmpty().lowercase()
        val json = runCatching {
            context.assets.open("supported-devices.json").bufferedReader().use { it.readText() }
        }.getOrNull() ?: return Evaluation(
            status = "unknown",
            launchLimited = true,
            message = "Supported-device list missing — treat sizing as limited until certified.",
        )
        val root = JSONObject(json)
        val devices = root.optJSONArray("devices") ?: return Evaluation(
            "unknown",
            true,
            "No devices listed — limited launch.",
        )
        for (i in 0 until devices.length()) {
            val entry = devices.getJSONObject(i)
            val entryMfr = entry.optString("manufacturer").lowercase()
            val mfrOk = mfr.isEmpty() || mfr.contains(entryMfr) || entryMfr.contains(mfr)
            if (!mfrOk) continue
            val tokens = entry.optJSONArray("modelContains") ?: continue
            var hit = mdl.isEmpty()
            for (t in 0 until tokens.length()) {
                if (mdl.contains(tokens.getString(t).lowercase())) {
                    hit = true
                    break
                }
            }
            if (!hit) continue
            return when (entry.optString("status")) {
                "certified" -> Evaluation(
                    "certified",
                    false,
                    "Device cohort is certified for retail millimetre measurement.",
                )
                "blocked" -> Evaluation(
                    "blocked",
                    true,
                    "This device is blocked for retail sizing.",
                )
                else -> Evaluation(
                    "candidate",
                    true,
                    "Launch candidate — certify via Brannock study before treating mm as sizing truth.",
                )
            }
        }
        return Evaluation(
            "unknown",
            true,
            "Device is outside the limited supported list — label results as estimate until certified.",
        )
    }
}
