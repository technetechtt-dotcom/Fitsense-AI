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
import com.fitsense.ai.utils.DataResult
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
    private val accuracyDatasetStore: com.fitsense.ai.accuracy.AccuracyDatasetStore,
    private val fitIdentityClient: com.fitsense.ai.identity.FitIdentityClient,
    private val syncClient: com.fitsense.ai.sync.SyncClient,
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

    private val _accuracyRecordCount = MutableStateFlow(0)
    val accuracyRecordCount: StateFlow<Int> = _accuracyRecordCount.asStateFlow()

    private val _accuracyShareUri = MutableStateFlow<android.net.Uri?>(null)
    val accuracyShareUri: StateFlow<android.net.Uri?> = _accuracyShareUri.asStateFlow()

    private val _fitTokenPreview = MutableStateFlow<String?>(null)
    val fitTokenPreview: StateFlow<String?> = _fitTokenPreview.asStateFlow()

    private val _recoveryCode = MutableStateFlow<String?>(null)
    val recoveryCode: StateFlow<String?> = _recoveryCode.asStateFlow()

    private val _shareToken = MutableStateFlow<String?>(null)
    val shareToken: StateFlow<String?> = _shareToken.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.ensureSignedIn()
            refreshSyncStatus()
            refreshAccuracyCount()
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

    fun setGroundTruth(lengthMm: Double?, widthMm: Double?, notes: String?) {
        mutatePrefs {
            it.copy(
                groundTruthLengthMm = lengthMm,
                groundTruthWidthMm = widthMm,
                accuracyStudyNotes = notes,
            )
        }
        _statusMessage.value = if (lengthMm == null && widthMm == null) {
            "Ground truth cleared."
        } else {
            "Ground truth saved: ${lengthMm}×${widthMm} mm."
        }
    }

    fun clearGroundTruth() = setGroundTruth(null, null, null)

    fun reportInvalidGroundTruth() {
        _statusMessage.value =
            "Enter plausible ground truth: length 120–360 mm, width 45–160 mm."
    }

    fun refreshAccuracyCount() {
        viewModelScope.launch {
            _accuracyRecordCount.value = accuracyDatasetStore.recordCount()
        }
    }

    fun exportAccuracyDataset(context: android.content.Context) {
        viewModelScope.launch {
            val copy = accuracyDatasetStore.exportShareCopy()
            if (copy == null) {
                _statusMessage.value = "No accuracy records to export yet."
                _accuracyShareUri.value = null
                return@launch
            }
            val uri = androidx.core.content.FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                copy,
            )
            _accuracyShareUri.value = uri
            _statusMessage.value = "Accuracy dataset ready to share (${copy.length()} bytes)."
            refreshAccuracyCount()
        }
    }

    fun clearAccuracyShareUri() {
        _accuracyShareUri.value = null
    }

    fun clearAccuracyDataset() {
        viewModelScope.launch {
            accuracyDatasetStore.clear()
            _accuracyRecordCount.value = 0
            _statusMessage.value = "Accuracy dataset cleared on device."
        }
    }

    fun exportPortableFitToken() {
        viewModelScope.launch {
            val profile = userRepository.ensureSignedIn().let {
                when (it) {
                    is DataResult.Success -> it.value
                    is DataResult.Failure -> {
                        _statusMessage.value = it.error.message
                        return@launch
                    }
                }
            }
            val payload = com.fitsense.ai.identity.PortableFitIdentity.Payload(
                fitId = profile.userId,
                l = profile.cachedFootLengthMm,
                w = profile.cachedFootWidthMm,
            )
            val token = com.fitsense.ai.identity.PortableFitIdentity.export(payload)
            _fitTokenPreview.value = token
            _statusMessage.value = "FSP1 token ready — copy and paste on another device."
        }
    }

    fun importPortableFitToken(token: String) {
        viewModelScope.launch {
            val payload = com.fitsense.ai.identity.PortableFitIdentity.import(token.trim())
            if (payload == null) {
                _statusMessage.value = "Invalid FSP1 token."
                return@launch
            }
            // FSP1 is unsigned — never treat forged millimetres as measured truth.
            _statusMessage.value =
                "FSP1 is unsigned and NOT trusted for sizing (preview only). " +
                    "Use a recovery/share code or re-scan. FitId=${payload.fitId} " +
                    "L=${payload.l ?: "—"} W=${payload.w ?: "—"}"
        }
    }

    fun issueFitRecoveryCode() {
        viewModelScope.launch {
            val profile = when (val user = userRepository.ensureSignedIn()) {
                is DataResult.Success -> user.value
                is DataResult.Failure -> {
                    _statusMessage.value = user.error.message
                    return@launch
                }
            }
            val json = syncClient.encodeFitProfile(
                userId = profile.userId,
                cachedLengthMm = profile.cachedFootLengthMm,
                cachedWidthMm = profile.cachedFootWidthMm,
                favouriteBrands = profile.preferences.preferredBrands,
            )
            val obj = kotlinx.serialization.json.Json.parseToJsonElement(json)
                as? kotlinx.serialization.json.JsonObject
            if (obj == null) {
                _statusMessage.value = "Could not build fit profile payload."
                return@launch
            }
            val issued = fitIdentityClient.issueRecoveryCode(obj)
            if (issued == null) {
                _statusMessage.value =
                    "Could not issue recovery code. Configure API and ensure device auth."
                return@launch
            }
            _recoveryCode.value = issued.recoveryCode
            _statusMessage.value = "Recovery code issued (one-time). Store it offline."
        }
    }

    fun redeemFitRecoveryCode(code: String) {
        viewModelScope.launch {
            val recovered = fitIdentityClient.recover(code.trim())
            if (recovered == null) {
                _statusMessage.value = "Recovery failed — invalid or already used."
                return@launch
            }
            fun num(key: String): Double? {
                val el = recovered.fitProfile[key] ?: return null
                return (el as? kotlinx.serialization.json.JsonPrimitive)?.content?.toDoubleOrNull()
            }
            val length = num("cachedFootLengthMm") ?: num("lengthMm")
            val width = num("cachedFootWidthMm") ?: num("widthMm")
            if (length != null && width != null) {
                userRepository.cacheLatestFootMetrics(length, width)
            }
            _statusMessage.value =
                "Recovered Fit ID ${recovered.fitId}. Length=${length ?: "—"} Width=${width ?: "—"}"
        }
    }

    fun createMerchantShareGrant(orgId: String) {
        viewModelScope.launch {
            val trimmed = orgId.trim()
            if (trimmed.length < 4) {
                _statusMessage.value = "Enter a merchant org id."
                return@launch
            }
            val profile = when (val user = userRepository.ensureSignedIn()) {
                is DataResult.Success -> user.value
                is DataResult.Failure -> {
                    _statusMessage.value = user.error.message
                    return@launch
                }
            }
            val json = syncClient.encodeFitProfile(
                userId = profile.userId,
                cachedLengthMm = profile.cachedFootLengthMm,
                cachedWidthMm = profile.cachedFootWidthMm,
                favouriteBrands = profile.preferences.preferredBrands,
            )
            val obj = kotlinx.serialization.json.Json.parseToJsonElement(json)
                as? kotlinx.serialization.json.JsonObject
            if (obj == null) {
                _statusMessage.value = "Could not build fit profile payload."
                return@launch
            }
            val issued = fitIdentityClient.createShareGrant(trimmed, obj)
            if (issued == null) {
                _statusMessage.value =
                    "Share grant failed. Check org id exists and API auth works."
                return@launch
            }
            _shareToken.value = issued.shareToken
            _statusMessage.value =
                "Merchant share token ready for ${issued.orgId} (${issued.purpose})."
        }
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
