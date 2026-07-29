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
 * Merchant org / API key for catalogue fetch.
 * Prefs override BuildConfig (`fitsense.merchant.*` in local.properties).
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

    suspend fun apiKey(): String? {
        val stored = dataStore.data.first()[API_KEY_KEY]?.trim().orEmpty()
        if (stored.isNotEmpty()) return stored
        val fromBuild = BuildConfig.MERCHANT_API_KEY.trim()
        return fromBuild.ifEmpty { null }
    }

    suspend fun save(orgId: String?, apiKey: String?) {
        dataStore.edit { prefs ->
            val o = orgId?.trim().orEmpty()
            val k = apiKey?.trim().orEmpty()
            if (o.isEmpty()) prefs.remove(ORG_ID_KEY) else prefs[ORG_ID_KEY] = o
            if (k.isEmpty()) prefs.remove(API_KEY_KEY) else prefs[API_KEY_KEY] = k
        }
    }

    companion object {
        private val ORG_ID_KEY = stringPreferencesKey("merchant_org_id")
        private val API_KEY_KEY = stringPreferencesKey("merchant_api_key")
    }
}
