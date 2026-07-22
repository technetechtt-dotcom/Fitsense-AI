package com.fitsense.ai.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Singleton
class LocalUserStore @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    suspend fun getUser(userId: String): DataResult<UserProfile?> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not read profile", it) },
    ) {
        val raw = dataStore.data.first()[profileKey(userId)] ?: return@safeCall null
        json.decodeFromString(UserProfile.serializer(), raw)
    }

    suspend fun upsertUser(profile: UserProfile): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not save profile", it) },
    ) {
        val encoded = json.encodeToString(profile)
        dataStore.edit { it[profileKey(profile.userId)] = encoded }
    }

    suspend fun deleteUser(userId: String): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not delete profile", it) },
    ) {
        dataStore.edit { it.remove(profileKey(userId)) }
    }

    private fun profileKey(userId: String) = stringPreferencesKey("user_profile_$userId")
}
