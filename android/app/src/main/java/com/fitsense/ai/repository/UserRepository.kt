package com.fitsense.ai.repository

import com.fitsense.ai.local.DeviceIdentityService
import com.fitsense.ai.local.LocalUserStore
import com.fitsense.ai.models.UserPreferences
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

/**
 * Source of truth for the authenticated user.
 *
 * - Backed by [DeviceIdentityService] for a stable on-device identity.
 * - Backed by [LocalUserStore] for profile + preferences.
 */
interface UserRepository {
    val profile: Flow<UserProfile?>
    suspend fun ensureSignedIn(): DataResult<UserProfile>
    suspend fun updatePreferences(preferences: UserPreferences): DataResult<Unit>
    suspend fun cacheLatestFootMetrics(lengthMm: Double, widthMm: Double): DataResult<Unit>
    suspend fun signOut(): DataResult<Unit>
}

class UserRepositoryImpl @Inject constructor(
    private val identityService: DeviceIdentityService,
    private val userStore: LocalUserStore,
) : UserRepository {

    private val _profile = MutableStateFlow<UserProfile?>(null)
    override val profile: Flow<UserProfile?> = _profile.asStateFlow()

    override suspend fun ensureSignedIn(): DataResult<UserProfile> {
        val deviceId = when (val id = identityService.getOrCreateDeviceId()) {
            is DataResult.Failure -> return id
            is DataResult.Success -> id.value
        }

        val existing = userStore.getUser(deviceId)
        return when (existing) {
            is DataResult.Failure -> existing
            is DataResult.Success -> {
                val profile = existing.value ?: run {
                    val created = UserProfile(
                        userId = deviceId,
                        isAnonymous = true,
                    )
                    when (val saved = userStore.upsertUser(created)) {
                        is DataResult.Failure -> return saved
                        is DataResult.Success -> created
                    }
                }
                _profile.value = profile
                DataResult.Success(profile)
            }
        }
    }

    override suspend fun updatePreferences(preferences: UserPreferences): DataResult<Unit> {
        val current = _profile.value
            ?: return DataResult.Failure(AppError.Auth("No signed-in user"))
        val updated = current.copy(
            preferences = preferences,
            updatedAtEpochMs = System.currentTimeMillis(),
        )
        return userStore.upsertUser(updated).onSuccess { _profile.value = updated }
    }

    override suspend fun cacheLatestFootMetrics(lengthMm: Double, widthMm: Double): DataResult<Unit> {
        val current = _profile.value
            ?: return DataResult.Failure(AppError.Auth("No signed-in user"))
        val updated = current.copy(
            cachedFootLengthMm = lengthMm,
            cachedFootWidthMm = widthMm,
            updatedAtEpochMs = System.currentTimeMillis(),
        )
        return userStore.upsertUser(updated).onSuccess { _profile.value = updated }
    }

    override suspend fun signOut(): DataResult<Unit> {
        _profile.value = null
        return identityService.clearDeviceId()
    }
}
