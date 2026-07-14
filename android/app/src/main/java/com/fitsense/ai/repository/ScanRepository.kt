package com.fitsense.ai.repository

import com.fitsense.ai.firebase.FirebaseStorageService
import com.fitsense.ai.firebase.FirestoreService
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

/**
 * Persists scans (Firestore) and their thumbnails (Storage).
 */
interface ScanRepository {
    fun observeScans(userId: String?): Flow<List<ScanResult>>
    suspend fun saveScan(scan: ScanResult, thumbnailJpegBytes: ByteArray? = null): DataResult<ScanResult>
    suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit>
}

class ScanRepositoryImpl @Inject constructor(
    private val firestore: FirestoreService,
    private val storage: FirebaseStorageService,
) : ScanRepository {

    override fun observeScans(userId: String?): Flow<List<ScanResult>> =
        if (userId == null) flowOf(emptyList()) else firestore.observeScans(userId)

    override suspend fun saveScan(
        scan: ScanResult,
        thumbnailJpegBytes: ByteArray?,
    ): DataResult<ScanResult> {
        // Optional thumbnail upload — failure should not block saving the scan.
        val thumbnailUrl: String? = if (thumbnailJpegBytes != null) {
            when (val r = storage.uploadScanThumbnail(scan.userId, thumbnailJpegBytes, scan.scanId)) {
                is DataResult.Success -> r.value
                is DataResult.Failure -> null
            }
        } else null

        val enriched = scan.copy(thumbnailUrl = thumbnailUrl ?: scan.thumbnailUrl)

        return when (val save = firestore.saveScan(enriched)) {
            is DataResult.Success -> DataResult.Success(enriched)
            is DataResult.Failure -> DataResult.Failure(save.error)
        }
    }

    override suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit> =
        firestore.deleteScan(userId, scanId)
}
