package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.MeasurementUnit
import com.fitsense.ai.models.UserPreferences
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val userRepository: UserRepository,
) : ViewModel() {

    val profile: StateFlow<UserProfile?> = userRepository.profile
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    fun setUnits(units: MeasurementUnit) = mutatePrefs { it.copy(units = units) }
    fun setCalibration(ref: CalibrationReference) = mutatePrefs { it.copy(defaultCalibration = ref) }
    fun setAnalyticsOptIn(enabled: Boolean) = mutatePrefs { it.copy(analyticsOptIn = enabled) }

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            userRepository.signOut()
            onSignedOut()
        }
    }

    private fun mutatePrefs(transform: (UserPreferences) -> UserPreferences) {
        viewModelScope.launch {
            val current = userRepository.profile.firstOrNull()?.preferences ?: UserPreferences()
            userRepository.updatePreferences(transform(current))
        }
    }
}
