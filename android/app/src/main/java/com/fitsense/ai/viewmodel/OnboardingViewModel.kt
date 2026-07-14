package com.fitsense.ai.viewmodel

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Owns the onboarding "skip / finish" state and persists the completion flag.
 */
@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) : ViewModel() {

    fun finishOnboarding(then: () -> Unit) {
        viewModelScope.launch {
            dataStore.edit { it[SplashViewModel.ONBOARDING_DONE_KEY] = true }
            then()
        }
    }
}
