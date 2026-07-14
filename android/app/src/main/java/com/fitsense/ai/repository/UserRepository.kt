package com.fitsense.ai.repository

import com.fitsense.ai.firebase.FirebaseAuthService
import com.fitsense.ai.firebase.FirestoreService
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
 * - Backed by [FirebaseAuthService] for identity.
 * - Backed by [FirestoreService] for profile + preferences.
 * - Exposes a hot [profile] [Flow] consumed by the home + settings screens.
 */
interface UserRepository {
    val profile: Flow<UserProfile?>
    suspend fun ensureSignedIn(): DataResult<UserProfile>
    suspend fun updatePreferences(preferences: UserPreferences): DataResult<Unit>
    suspend fun cacheLatestFootMetrics(lengthMm: Double, widthMm: Double): DataResult<Unit>
    suspend fun signOut(): DataResult<Unit>
}

class UserRepositoryImpl @Inject constructor(
    private val authService: FirebaseAuthService,
    private val firestore: FirestoreService,
) : UserRepository {

    private val _profile = MutableStateFlow<UserProfile?>(null)
    override val profile: Flow<UserProfile?> = _profile.asStateFlow()

    override suspend fun ensureSignedIn(): DataResult<UserProfile> {
        val signIn = authService.ensureSignedIn()
        return when (signIn) {
            is DataResult.Failure -> signIn
            is DataResult.Success -> {
                val firebaseUser = signIn.value
                val existing = firestore.getUser(firebaseUser.uid)
                val profile = when (existing) {
                    is DataResult.Failure -> {
                        return existing
                    }
                    is DataResult.Success -> existing.value ?: UserProfile(
                        userId = firebaseUser.uid,
                        displayName = firebaseUser.displayName,
                        email = firebaseUser.email,
                        isAnonymous = firebaseUser.isAnonymous,
                    ).also { firestore.upsertUser(it) }
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
        return firestore.upsertUser(updated).onSuccess { _profile.value = updated }
    }

    override suspend fun cacheLatestFootMetrics(lengthMm: Double, widthMm: Double): DataResult<Unit> {
        val current = _profile.value
            ?: return DataResult.Failure(AppError.Auth("No signed-in user"))
        val updated = current.copy(
            cachedFootLengthMm = lengthMm,
            cachedFootWidthMm = widthMm,
            updatedAtEpochMs = System.currentTimeMillis(),
        )
        return firestore.upsertUser(updated).onSuccess { _profile.value = updated }
    }

    override suspend fun signOut(): DataResult<Unit> {
        _profile.value = null
        return authService.signOut()
    }
}
