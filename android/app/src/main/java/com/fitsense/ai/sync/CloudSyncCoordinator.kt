package com.fitsense.ai.sync

import com.fitsense.ai.api.ApiConfig
import com.fitsense.ai.auth.DeviceAuthClient
import com.fitsense.ai.local.LocalScanStore
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.UserProfile
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Coordinates optional cloud auth/sync when API + user consent allow.
 * Owns the offline outbox flush path (exponential backoff, no silent drop).
 */
@Singleton
class CloudSyncCoordinator @Inject constructor(
    private val authClient: DeviceAuthClient,
    private val syncClient: SyncClient,
    private val outbox: SyncOutboxStore,
    private val scanStore: LocalScanStore,
) {
    private val flushMutex = Mutex()

    data class SyncStatus(
        val apiConfigured: Boolean,
        val authenticated: Boolean,
        val pendingOps: Int = 0,
        val failedOps: Int = 0,
        val lastError: String? = null,
    )

    suspend fun ensureAuthenticated(): SyncStatus {
        if (!ApiConfig.isConfigured) {
            return SyncStatus(apiConfigured = false, authenticated = false)
        }
        return runCatching {
            val token = authClient.ensureAccessToken()
            SyncStatus(
                apiConfigured = true,
                authenticated = token != null,
                pendingOps = outbox.pendingCount(),
                failedOps = outbox.failedCount(),
            )
        }.getOrElse {
            SyncStatus(
                apiConfigured = true,
                authenticated = false,
                pendingOps = outbox.pendingCount(),
                failedOps = outbox.failedCount(),
                lastError = it.message,
            )
        }
    }

    /** Enqueue scan for sync; attempt immediate flush. Never drops the op on failure. */
    suspend fun enqueueScan(scan: ScanResult, cloudSyncEnabled: Boolean): Boolean {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return false
        outbox.enqueueUpsertScan(scan.scanId, syncClient.encodeScan(scan))
        flushOutbox()
        return outbox.snapshot().none { it.id == "scan:${scan.scanId}" }
    }

    suspend fun enqueueDeleteScan(scanId: String, cloudSyncEnabled: Boolean) {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return
        outbox.enqueueDeleteScan(scanId)
        flushOutbox()
    }

    suspend fun enqueueProfile(profile: UserProfile, cloudSyncEnabled: Boolean) {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return
        val payload = syncClient.encodeFitProfile(
            userId = profile.userId,
            cachedLengthMm = profile.cachedFootLengthMm,
            cachedWidthMm = profile.cachedFootWidthMm,
            favouriteBrands = profile.preferences.preferredBrands,
        )
        outbox.enqueueUpsertProfile(profile.userId, payload)
        flushOutbox()
    }

    suspend fun flushOutbox(): SyncStatus = flushMutex.withLock {
        if (!ApiConfig.isConfigured) {
            return SyncStatus(apiConfigured = false, authenticated = false)
        }
        if (authClient.ensureAccessToken() == null) {
            return SyncStatus(
                apiConfigured = true,
                authenticated = false,
                pendingOps = outbox.pendingCount(),
                failedOps = outbox.failedCount(),
                lastError = "Not authenticated",
            )
        }
        var lastError: String? = null
        for (item in outbox.dueItems()) {
            val ok = when (item.kind) {
                SyncOutboxStore.OpKind.UPSERT_SCAN.name -> {
                    val payload = item.payloadJson
                    if (payload.isNullOrBlank()) false
                    else syncClient.pushScanJson(item.entityId, payload)
                }
                SyncOutboxStore.OpKind.DELETE_SCAN.name ->
                    syncClient.deleteScan(item.entityId)
                SyncOutboxStore.OpKind.UPSERT_PROFILE.name -> {
                    val payload = item.payloadJson
                    if (payload.isNullOrBlank()) false
                    else syncClient.pushFitProfileJson(payload)
                }
                else -> false
            }
            if (ok) {
                outbox.markAttempt(item.id, ok = true)
            } else {
                lastError = "Failed ${item.kind} ${item.entityId}"
                outbox.markAttempt(item.id, ok = false, error = lastError)
            }
        }
        SyncStatus(
            apiConfigured = true,
            authenticated = true,
            pendingOps = outbox.pendingCount(),
            failedOps = outbox.failedCount(),
            lastError = lastError,
        )
    }

    /** Pull cloud scans and merge into local store (upsert by scanId). */
    suspend fun pullAndMerge(cloudSyncEnabled: Boolean): Int {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return 0
        if (authClient.ensureAccessToken() == null) return 0
        val pull = syncClient.pull() ?: return 0
        var imported = 0
        for (element in pull.scans) {
            val remote = scanFromJson(element.jsonObject) ?: continue
            scanStore.saveScan(remote)
            imported++
        }
        return imported
    }

    private fun scanFromJson(obj: JsonObject): ScanResult? {
        val scanId = obj["scanId"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["userId"]?.jsonPrimitive?.contentOrNull ?: return null
        val created = obj["createdAtEpochMs"]?.jsonPrimitive?.longOrNull
            ?: System.currentTimeMillis()
        return ScanResult(
            scanId = scanId,
            userId = userId,
            createdAtEpochMs = created,
            arcoreUsed = obj["arcoreUsed"]?.jsonPrimitive?.booleanOrNull ?: false,
            deviceModel = obj["deviceModel"]?.jsonPrimitive?.contentOrNull,
            leftFoot = null,
            rightFoot = null,
        )
    }

    suspend fun eraseCloudIfEnabled(cloudSyncEnabled: Boolean): Boolean {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return false
        val ok = syncClient.eraseAll()
        if (ok) outbox.clear()
        return ok
    }

    suspend fun exportCloudIfEnabled(cloudSyncEnabled: Boolean): String? {
        if (!cloudSyncEnabled || !ApiConfig.isConfigured) return null
        return syncClient.exportJson()
    }

    suspend fun signOut() {
        authClient.logoutRemote()
        outbox.clear()
    }

    suspend fun clearAuth() {
        authClient.clearSession()
    }
}
