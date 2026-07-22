package com.fitsense.ai.api

import com.fitsense.ai.BuildConfig

/**
 * FitSense API origin. Prefer `local.properties` key `fitsense.api.baseUrl`
 * injected into BuildConfig; empty disables cloud auth/sync.
 */
object ApiConfig {
    val baseUrl: String?
        get() {
            val raw = BuildConfig.API_BASE_URL.trim()
            if (raw.isEmpty()) return null
            return raw.trimEnd('/')
        }

    val isConfigured: Boolean get() = baseUrl != null
}
