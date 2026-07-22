package com.fitsense.ai.accuracy

import android.content.Context
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.Foot
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Append-only store for controlled validation captures.
 * Used to build the first accuracy dataset during pilot testing.
 */
@Singleton
class AccuracyDatasetStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val json = Json { prettyPrint = true; encodeDefaults = true }
    private val file: File
        get() = File(context.filesDir, "accuracy_dataset.jsonl")

    @Serializable
    data class AccuracyRecord(
        val recordedAtEpochMs: Long,
        val deviceModel: String,
        val foot: Foot,
        val calibration: CalibrationReference,
        val measuredLengthMm: Double,
        val measuredWidthMm: Double,
        val confidence: Float,
        val groundTruthLengthMm: Double? = null,
        val groundTruthWidthMm: Double? = null,
        val notes: String? = null,
    )

    suspend fun append(record: AccuracyRecord) = withContext(Dispatchers.IO) {
        file.parentFile?.mkdirs()
        file.appendText(json.encodeToString(record) + "\n")
    }

    suspend fun readAll(): List<AccuracyRecord> = withContext(Dispatchers.IO) {
        if (!file.exists()) return@withContext emptyList()
        file.readLines()
            .filter { it.isNotBlank() }
            .mapNotNull { line -> runCatching { json.decodeFromString<AccuracyRecord>(line) }.getOrNull() }
    }
}
