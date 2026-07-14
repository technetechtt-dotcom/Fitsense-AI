package com.fitsense.ai.viewmodel

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.ui.navigation.Destinations
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Decides whether the user should land on onboarding or home on cold start.
 * Also kicks off the anonymous Firebase sign-in so the rest of the app has a
 * valid `userId` from the very first frame.
 */
@HiltViewModel
class SplashViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val dataStore: DataStore<Preferences>,
) : ViewModel() {

    private val _startDestination = MutableStateFlow<Destinations?>(null)
    val startDestination: StateFlow<Destinations?> = _startDestination.asStateFlow()

    init {
        viewModelScope.launch {
            val onboarded = runCatching {
                dataStore.data.first()[ONBOARDING_DONE_KEY] ?: false
            }.getOrDefault(false)

            // Anonymous sign-in fires concurrently — we don't block landing on it.
            launch { userRepository.ensureSignedIn() }

            _startDestination.value =
                if (onboarded) Destinations.Home else Destinations.Onboarding
        }
    }

    suspend fun markOnboardingComplete() {
        dataStore.edit { it[ONBOARDING_DONE_KEY] = true }
    }

    companion object {
        val ONBOARDING_DONE_KEY = booleanPreferencesKey("onboarding_completed")
    }
}
