package com.fitsense.ai.firebase

import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.Constants
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Wraps Firebase Storage so we only expose suspend functions returning
 * [DataResult] envelopes.
 */
@Singleton
class FirebaseStorageService @Inject constructor(
    private val storage: FirebaseStorage,
) {

    /** Uploads a JPEG scan thumbnail and returns its public download URL. */
    suspend fun uploadScanThumbnail(
        userId: String,
        bytes: ByteArray,
        scanId: String = UUID.randomUUID().toString(),
    ): DataResult<String> = safeCall(
        errorFactory = { AppError.Network(it.message ?: "Storage upload failed", it) },
    ) {
        val ref = storage.reference
            .child(Constants.SCAN_THUMBNAIL_PATH)
            .child(userId)
            .child("$scanId.jpg")

        ref.putBytes(bytes).await()
        ref.downloadUrl.await().toString()
    }
}
