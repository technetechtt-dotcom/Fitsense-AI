package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.MeasurementUnit
import com.fitsense.ai.models.UserPreferences
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.sync.CloudSyncCoordinator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val cloudSyncCoordinator: CloudSyncCoordinator,
) : ViewModel() {

    val profile: StateFlow<UserProfile?> = userRepository.profile
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _syncStatus = MutableStateFlow(
        CloudSyncCoordinator.SyncStatus(
            apiConfigured = ApiConfig.isConfigured,
            authenticated = false,
        ),
    )
    val syncStatus: StateFlow<CloudSyncCoordinator.SyncStatus> = _syncStatus.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.ensureSignedIn()
            refreshSyncStatus()
        }
    }

    fun setUnits(units: MeasurementUnit) = mutatePrefs { it.copy(units = units) }
    fun setCalibration(ref: CalibrationReference) = mutatePrefs { it.copy(defaultCalibration = ref) }
    fun setAnalyticsOptIn(enabled: Boolean) = mutatePrefs { it.copy(analyticsOptIn = enabled) }
    fun setCloudSyncOptIn(enabled: Boolean) = mutatePrefs { it.copy(cloudSyncOptIn = enabled) }

    fun setGroundTruth(lengthMm: Double?, widthMm: Double?, notes: String?) =
        mutatePrefs {
            it.copy(
                groundTruthLengthMm = lengthMm,
                groundTruthWidthMm = widthMm,
                accuracyStudyNotes = notes,
            )
        }

    fun refreshSyncStatus() {
        viewModelScope.launch {
            _syncStatus.value = cloudSyncCoordinator.ensureAuthenticated()
        }
    }

    fun eraseCloudData() {
        viewModelScope.launch {
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            val ok = cloudSyncCoordinator.eraseCloudIfEnabled(enabled)
            _statusMessage.value = if (ok) "Cloud data erased." else "Cloud erase skipped or failed."
        }
    }

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            cloudSyncCoordinator.clearAuth()
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
