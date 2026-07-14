package com.fitsense.ai.firebase

import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Thin wrapper around [FirebaseAuth] that:
 *  • Exposes the current [FirebaseUser] as a cold [Flow] (auth state changes)
 *  • Guarantees a non-null user via anonymous sign-in on first use
 *  • Returns typed [DataResult] envelopes instead of throwing.
 */
@Singleton
class FirebaseAuthService @Inject constructor(
    private val auth: FirebaseAuth,
) {

    val currentUser: FirebaseUser? get() = auth.currentUser

    fun authState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    /** Ensure we have an authenticated user; signs in anonymously if needed. */
    suspend fun ensureSignedIn(): DataResult<FirebaseUser> = safeCall(
        errorFactory = { AppError.Auth(it.message ?: "Auth failed", it) },
    ) {
        auth.currentUser ?: auth.signInAnonymously().await().user!!
    }

    suspend fun signOut(): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Auth(it.message ?: "Sign-out failed", it) },
    ) {
        auth.signOut()
    }
}
