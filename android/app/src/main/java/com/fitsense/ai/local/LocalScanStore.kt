package com.fitsense.ai.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Singleton
class LocalScanStore @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    fun observeScans(userId: String): Flow<List<ScanResult>> =
        dataStore.data.map { prefs ->
            val raw = prefs[scansKey(userId)] ?: return@map emptyList()
            json.decodeFromString(ListSerializer(ScanResult.serializer()), raw)
                .sortedByDescending { it.createdAtEpochMs }
                .take(50)
        }

    suspend fun getScan(userId: String, scanId: String): ScanResult? {
        val key = scansKey(userId)
        val current = dataStore.data.first()[key] ?: return null
        return json.decodeFromString(ListSerializer(ScanResult.serializer()), current)
            .firstOrNull { it.scanId == scanId }
    }

    suspend fun saveScan(scan: ScanResult): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not save scan", it) },
    ) {
        val key = scansKey(scan.userId)
        val current = dataStore.data.first()[key]
        val scans = if (current == null) {
            listOf(scan)
        } else {
            val existing = json.decodeFromString(ListSerializer(ScanResult.serializer()), current)
            (existing.filterNot { it.scanId == scan.scanId } + scan)
                .sortedByDescending { it.createdAtEpochMs }
                .take(50)
        }
        dataStore.edit { it[key] = json.encodeToString(scans) }
    }

    suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not delete scan", it) },
    ) {
        val key = scansKey(userId)
        val current = dataStore.data.first()[key] ?: return@safeCall
        val scans = json.decodeFromString(ListSerializer(ScanResult.serializer()), current)
            .filterNot { it.scanId == scanId }
        dataStore.edit { it[key] = json.encodeToString(scans) }
    }

    suspend fun deleteAllScans(userId: String): DataResult<Unit> = safeCall(
        errorFactory = { AppError.Storage(it.message ?: "Could not delete scans", it) },
    ) {
        dataStore.edit { it.remove(scansKey(userId)) }
    }

    private fun scansKey(userId: String) = stringPreferencesKey("user_scans_$userId")
}
