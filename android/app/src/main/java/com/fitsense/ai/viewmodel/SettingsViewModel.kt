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

    private val _exportPreview = MutableStateFlow<String?>(null)
    val exportPreview: StateFlow<String?> = _exportPreview.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.ensureSignedIn()
            refreshSyncStatus()
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            if (enabled) {
                cloudSyncCoordinator.flushOutbox()
                refreshSyncStatus()
            }
        }
    }

    fun setUnits(units: MeasurementUnit) = mutatePrefs { it.copy(units = units) }
    fun setCalibration(ref: CalibrationReference) = mutatePrefs { it.copy(defaultCalibration = ref) }
    fun setAnalyticsOptIn(enabled: Boolean) = mutatePrefs { it.copy(analyticsOptIn = enabled) }

    fun setCloudSyncOptIn(enabled: Boolean) {
        mutatePrefs { it.copy(cloudSyncOptIn = enabled) }
        if (enabled) {
            viewModelScope.launch {
                refreshSyncStatus()
                val p = userRepository.profile.firstOrNull()
                if (p != null) cloudSyncCoordinator.enqueueProfile(p, true)
                cloudSyncCoordinator.flushOutbox()
                refreshSyncStatus()
            }
        }
    }

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

    fun retryPendingSync() {
        viewModelScope.launch {
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            if (!enabled) {
                _statusMessage.value = "Enable cloud sync to retry."
                return@launch
            }
            val status = cloudSyncCoordinator.flushOutbox()
            _syncStatus.value = status
            _statusMessage.value = when {
                status.pendingOps == 0 && status.failedOps == 0 -> "All cloud ops synced."
                status.failedOps > 0 ->
                    "Synced with ${status.failedOps} failed — will retry with backoff."
                else -> "Pending ops: ${status.pendingOps}"
            }
        }
    }

    fun pullFromCloud() {
        viewModelScope.launch {
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            val n = cloudSyncCoordinator.pullAndMerge(enabled)
            _statusMessage.value = if (enabled) "Imported $n scans from cloud." else "Cloud sync off."
            refreshSyncStatus()
        }
    }

    fun exportCloudData() {
        viewModelScope.launch {
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            val json = cloudSyncCoordinator.exportCloudIfEnabled(enabled)
            if (json == null) {
                _statusMessage.value = "Export skipped or failed."
                _exportPreview.value = null
            } else {
                _exportPreview.value = json.take(400) + if (json.length > 400) "…" else ""
                _statusMessage.value = "Export ready (${json.length} bytes)."
            }
        }
    }

    fun eraseCloudData() {
        viewModelScope.launch {
            val enabled = profile.value?.preferences?.cloudSyncOptIn == true
            val ok = cloudSyncCoordinator.eraseCloudIfEnabled(enabled)
            _statusMessage.value = if (ok) "Cloud data erased." else "Cloud erase skipped or failed."
            refreshSyncStatus()
        }
    }

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            cloudSyncCoordinator.signOut()
            userRepository.signOut()
            onSignedOut()
        }
    }

    private fun mutatePrefs(transform: (UserPreferences) -> UserPreferences) {
        viewModelScope.launch {
            val current = userRepository.profile.firstOrNull()?.preferences ?: UserPreferences()
            userRepository.updatePreferences(transform(current))
            val profile = userRepository.profile.firstOrNull()
            if (profile?.preferences?.cloudSyncOptIn == true) {
                cloudSyncCoordinator.enqueueProfile(profile, true)
            }
        }
    }
}
