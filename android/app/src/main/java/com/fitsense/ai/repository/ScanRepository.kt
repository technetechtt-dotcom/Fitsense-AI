package com.fitsense.ai.repository

import com.fitsense.ai.local.LocalScanStore
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.utils.DataResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

/**
 * Persists scans locally on device.
 */
interface ScanRepository {
    fun observeScans(userId: String?): Flow<List<ScanResult>>
    suspend fun saveScan(scan: ScanResult): DataResult<ScanResult>
    suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit>
}

class ScanRepositoryImpl @Inject constructor(
    private val scanStore: LocalScanStore,
) : ScanRepository {

    override fun observeScans(userId: String?): Flow<List<ScanResult>> =
        if (userId == null) flowOf(emptyList()) else scanStore.observeScans(userId)

    override suspend fun saveScan(scan: ScanResult): DataResult<ScanResult> {
        return when (val save = scanStore.saveScan(scan)) {
            is DataResult.Success -> DataResult.Success(scan)
            is DataResult.Failure -> DataResult.Failure(save.error)
        }
    }

    override suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit> =
        scanStore.deleteScan(userId, scanId)
}
