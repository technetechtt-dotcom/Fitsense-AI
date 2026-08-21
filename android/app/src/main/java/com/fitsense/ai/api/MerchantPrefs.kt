package com.fitsense.ai.api

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fitsense.ai.BuildConfig
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Merchant org for catalogue fetch. Permanent API keys are not stored on-device;
 * catalogue reads use device auth + short-lived catalogue tokens.
 */
@Singleton
class MerchantPrefs @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    suspend fun orgId(): String? {
        val stored = dataStore.data.first()[ORG_ID_KEY]?.trim().orEmpty()
        if (stored.isNotEmpty()) return stored
        val fromBuild = BuildConfig.MERCHANT_ORG_ID.trim()
        return fromBuild.ifEmpty { null }
    }

    suspend fun save(orgId: String?) {
        dataStore.edit { prefs ->
            val o = orgId?.trim().orEmpty()
            if (o.isEmpty()) prefs.remove(ORG_ID_KEY) else prefs[ORG_ID_KEY] = o
            // Drop any legacy permanent API key material.
            prefs.remove(API_KEY_KEY)
        }
    }

    companion object {
        private val ORG_ID_KEY = stringPreferencesKey("merchant_org_id")
        private val API_KEY_KEY = stringPreferencesKey("merchant_api_key")
    }
}
