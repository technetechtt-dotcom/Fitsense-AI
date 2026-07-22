package com.fitsense.ai.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.first

/**
 * Stable on-device identity used as the user id for local persistence.
 */
@Singleton
class DeviceIdentityService @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    suspend fun getOrCreateDeviceId(): DataResult<String> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not read device id", it) },
    ) {
        val prefs = dataStore.data.first()
        val existing = prefs[DEVICE_ID_KEY]
        if (existing != null) return@safeCall existing
        val created = UUID.randomUUID().toString()
        dataStore.edit { it[DEVICE_ID_KEY] = created }
        created
    }

    suspend fun clearDeviceId(): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not clear device id", it) },
    ) {
        dataStore.edit { it.remove(DEVICE_ID_KEY) }
    }

    companion object {
        private val DEVICE_ID_KEY = stringPreferencesKey("device_id")
    }
}
