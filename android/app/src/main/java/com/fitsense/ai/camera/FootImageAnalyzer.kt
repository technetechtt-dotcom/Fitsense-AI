package com.fitsense.ai.camera

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import androidx.camera.core.ImageProxy
import com.fitsense.ai.vision.FootContourDetector
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Analyzer used by CameraX's [androidx.camera.core.ImageAnalysis] to surface a
 * lightweight, downsampled bitmap + an OpenCV-detected foot contour to the UI
 * for the real-time overlay.
 *
 * We run at most once per [throttleNs] to keep mid-range devices smooth.
 */
@Singleton
class FootImageAnalyzer @Inject constructor(
    private val contourDetector: FootContourDetector,
) {

    data class AnalysisFrame(
        val widthPx: Int,
        val heightPx: Int,
        val contour: FootContourDetector.FootContour?,
        val ts: Long = System.currentTimeMillis(),
    )

    private val _latest = MutableStateFlow<AnalysisFrame?>(null)
    val latest: StateFlow<AnalysisFrame?> = _latest.asStateFlow()

    private var lastRunNs: Long = 0L
    private val throttleNs: Long = 100_000_000L // 10 Hz

    fun analyze(image: ImageProxy) {
        try {
            val now = System.nanoTime()
            if (now - lastRunNs < throttleNs) return
            lastRunNs = now

            val bitmap = image.toBitmap720() ?: return
            val contour = contourDetector.detect(bitmap)
            _latest.value = AnalysisFrame(bitmap.width, bitmap.height, contour)
        } finally {
            image.close()
        }
    }

    private fun ImageProxy.toBitmap720(): Bitmap? {
        if (format != ImageFormat.YUV_420_888) return null
        val yBuffer = planes[0].buffer
        val uBuffer = planes[1].buffer
        val vBuffer = planes[2].buffer
        val ySize = yBuffer.remaining()
        val uSize = uBuffer.remaining()
        val vSize = vBuffer.remaining()

        val nv21 = ByteArray(ySize + uSize + vSize)
        yBuffer.get(nv21, 0, ySize)
        vBuffer.get(nv21, ySize, vSize)
        uBuffer.get(nv21, ySize + vSize, uSize)

        val yuv = YuvImage(nv21, ImageFormat.NV21, width, height, null)
        val out = ByteArrayOutputStream()
        yuv.compressToJpeg(Rect(0, 0, width, height), 70, out)
        val bytes = out.toByteArray()
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    }
}
