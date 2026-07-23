package com.fitsense.ai.sync

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Durable offline outbox for cloud sync ops. Prevents silent data loss when
 * push fails or the device is offline; flushed with exponential backoff.
 */
@Singleton
class SyncOutboxStore @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    enum class OpKind { UPSERT_SCAN, DELETE_SCAN, UPSERT_PROFILE }

    enum class OpStatus { PENDING, FAILED, SYNCED }

    @Serializable
    data class OutboxItem(
        val id: String,
        val kind: String,
        val entityId: String,
        val payloadJson: String? = null,
        val createdAtEpochMs: Long = System.currentTimeMillis(),
        val attempts: Int = 0,
        val nextAttemptEpochMs: Long = 0,
        val lastError: String? = null,
        val status: String = OpStatus.PENDING.name,
    )

    fun snapshot(): List<OutboxItem> = readAll()

    fun pendingCount(): Int =
        readAll().count { it.status != OpStatus.SYNCED.name }

    fun failedCount(): Int =
        readAll().count { it.status == OpStatus.FAILED.name }

    fun enqueueUpsertScan(scanId: String, payloadJson: String) {
        upsert(
            OutboxItem(
                id = "scan:$scanId",
                kind = OpKind.UPSERT_SCAN.name,
                entityId = scanId,
                payloadJson = payloadJson,
            ),
        )
    }

    fun enqueueDeleteScan(scanId: String) {
        upsert(
            OutboxItem(
                id = "scan-del:$scanId",
                kind = OpKind.DELETE_SCAN.name,
                entityId = scanId,
            ),
        )
    }

    fun enqueueUpsertProfile(userId: String, payloadJson: String) {
        upsert(
            OutboxItem(
                id = "profile:$userId",
                kind = OpKind.UPSERT_PROFILE.name,
                entityId = userId,
                payloadJson = payloadJson,
            ),
        )
    }

    fun markAttempt(id: String, ok: Boolean, error: String? = null) {
        val items = readAll().toMutableList()
        val idx = items.indexOfFirst { it.id == id }
        if (idx < 0) return
        val current = items[idx]
        if (ok) {
            items.removeAt(idx)
        } else {
            val attempts = current.attempts + 1
            val delayMs = (1_000L * (1L shl attempts.coerceAtMost(6))).coerceAtMost(60_000L)
            items[idx] = current.copy(
                attempts = attempts,
                nextAttemptEpochMs = System.currentTimeMillis() + delayMs,
                lastError = error,
                status = OpStatus.FAILED.name,
            )
        }
        writeAll(items)
    }

    fun dueItems(nowEpochMs: Long = System.currentTimeMillis()): List<OutboxItem> =
        readAll().filter {
            it.status != OpStatus.SYNCED.name && it.nextAttemptEpochMs <= nowEpochMs
        }

    fun clear() {
        prefs.edit().remove(KEY_ITEMS).apply()
    }

    private fun upsert(item: OutboxItem) {
        val items = readAll().toMutableList()
        val idx = items.indexOfFirst { it.id == item.id }
        if (idx >= 0) items[idx] = item else items.add(item)
        writeAll(items)
    }

    private fun readAll(): List<OutboxItem> {
        val raw = prefs.getString(KEY_ITEMS, null) ?: return emptyList()
        return runCatching {
            json.decodeFromString<List<OutboxItem>>(raw)
        }.getOrDefault(emptyList())
    }

    private fun writeAll(items: List<OutboxItem>) {
        prefs.edit().putString(KEY_ITEMS, json.encodeToString(items)).apply()
    }

    companion object {
        private const val FILE_NAME = "fitsense_sync_outbox"
        private const val KEY_ITEMS = "items"
    }
}
