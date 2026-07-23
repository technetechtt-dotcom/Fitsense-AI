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
 * One JSON object per line (compact) so Node analysis scripts can parse line-by-line.
 */
@Singleton
class AccuracyDatasetStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val json = Json {
        prettyPrint = false
        encodeDefaults = true
        ignoreUnknownKeys = true
    }

    private val file: File
        get() = File(context.filesDir, "accuracy_dataset.jsonl")

    @Serializable
    data class AccuracyRecord(
        val recordedAtEpochMs: Long,
        val deviceModel: String,
        val manufacturer: String? = null,
        val osVersion: String? = null,
        val sdkInt: Int? = null,
        val appVersion: String? = null,
        val algorithmVersion: String = ALGORITHM_VERSION,
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
        val text = file.readText()
        if (text.isBlank()) return@withContext emptyList()
        val byLine = text.lineSequence()
            .map { it.trim() }
            .filter { it.startsWith("{") && it.endsWith("}") }
            .mapNotNull { line ->
                runCatching { json.decodeFromString<AccuracyRecord>(line) }.getOrNull()
            }
            .toList()
        if (byLine.isNotEmpty()) return@withContext byLine
        // Legacy pretty-printed objects (one or more concatenated).
        splitJsonObjects(text).mapNotNull { chunk ->
            runCatching { json.decodeFromString<AccuracyRecord>(chunk) }.getOrNull()
        }
    }

    suspend fun recordCount(): Int = readAll().size

    /** Absolute path for adb pull / FileProvider. */
    fun datasetFile(): File = file

    /**
     * Copy dataset into cache for sharing via FileProvider.
     * Returns null when empty.
     */
    suspend fun exportShareCopy(): File? = withContext(Dispatchers.IO) {
        if (!file.exists() || file.length() == 0L) return@withContext null
        val out = File(context.cacheDir, "accuracy_dataset_export.jsonl")
        file.copyTo(out, overwrite = true)
        out
    }

    suspend fun clear(): Unit = withContext(Dispatchers.IO) {
        if (file.exists()) file.delete()
    }

    private fun splitJsonObjects(text: String): List<String> {
        val out = mutableListOf<String>()
        var depth = 0
        var start = -1
        for (i in text.indices) {
            when (text[i]) {
                '{' -> {
                    if (depth == 0) start = i
                    depth++
                }
                '}' -> {
                    depth--
                    if (depth == 0 && start >= 0) {
                        out += text.substring(start, i + 1)
                        start = -1
                    }
                }
            }
        }
        return out
    }

    companion object {
        /** Bump when measurement pipeline semantics change (homography / gates). */
        const val ALGORITHM_VERSION = "ref-homography-v1"
    }
}
