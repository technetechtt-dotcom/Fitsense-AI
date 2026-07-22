package com.fitsense.ai.sync

import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.auth.DeviceAuthClient
import com.fitsense.ai.models.ScanResult
import javax.inject.Inject
import javax.inject.Singleton

/** Coordinates optional cloud auth/sync when API + user consent allow. */
@Singleton
class CloudSyncCoordinator @Inject constructor(
    private val authClient: DeviceAuthClient,
    private val syncClient: SyncClient,
) {
    data class SyncStatus(
        val apiConfigured: Boolean,
        val authenticated: Boolean,
        val lastError: String? = null,
    )

    suspend fun ensureAuthenticated(): SyncStatus {
        if (!ApiConfig.isConfigured) {
            return SyncStatus(apiConfigured = false, authenticated = false)
        }
        return runCatching {
            val token = authClient.ensureAccessToken()
            SyncStatus(apiConfigured = true, authenticated = token != null)
        }.getOrElse {
            SyncStatus(apiConfigured = true, authenticated = false, lastError = it.message)
        }
    }

    suspend fun pushScanIfEnabled(scan: ScanResult, cloudSyncEnabled: Boolean): Boolean {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return false
        if (authClient.ensureAccessToken() == null) return false
        return syncClient.pushScan(scan)
    }

    suspend fun eraseCloudIfEnabled(cloudSyncEnabled: Boolean): Boolean {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return false
        return syncClient.eraseAll()
    }

    suspend fun exportCloudIfEnabled(cloudSyncEnabled: Boolean): String? {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return null
        return syncClient.exportJson()
    }

    suspend fun clearAuth() {
        authClient.clearSession()
    }
}
