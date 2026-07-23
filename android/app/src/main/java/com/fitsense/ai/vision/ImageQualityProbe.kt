package com.fitsense.ai.vision

import android.graphics.Bitmap
import javax.inject.Inject
import kotlin.math.abs

/**
 * Cheap sharpness and luminance checks on a downscaled frame.
 * Mirrors the web `probeImageQuality` thresholds.
 *
 * Also rejects frames where high-contrast content hugs the border —
 * a cheap proxy for a clipped foot or reference leaving the frame.
 */
class ImageQualityProbe @Inject constructor() {

    data class ImageQuality(
        val sharpness: Double,
        val meanLuminance: Double,
        val shadowFraction: Double,
        val highlightFraction: Double,
        val borderEdgeFraction: Double,
        val ok: Boolean,
        val issue: String?,
    )

    fun probe(bitmap: Bitmap): ImageQuality {
        if (bitmap.width == 0 || bitmap.height == 0) {
            return ImageQuality(0.0, 0.0, 0.0, 0.0, 0.0, false, "Empty frame.")
        }
        val scale = minOf(1.0, MAX_PROBE_WIDTH.toDouble() / bitmap.width)
        val w = maxOf(1, (bitmap.width * scale).toInt())
        val h = maxOf(1, (bitmap.height * scale).toInt())
        val scaled = Bitmap.createScaledBitmap(bitmap, w, h, true)
        val pixels = IntArray(w * h)
        scaled.getPixels(pixels, 0, w, 0, 0, w, h)
        if (scaled !== bitmap) scaled.recycle()

        val gray = IntArray(w * h)
        var lumSum = 0.0
        var shadow = 0
        var highlight = 0
        for (i in pixels.indices) {
            val p = pixels[i]
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF
            val lum = (r * 0.299 + g * 0.587 + b * 0.114).toInt()
            gray[i] = lum
            lumSum += lum
            if (lum < 20) shadow++
            if (lum > 245) highlight++
        }
        val count = (w * h).toDouble()
        val meanLuminance = lumSum / count
        val shadowFraction = shadow / count
        val highlightFraction = highlight / count

        var sum = 0.0
        var sumSq = 0.0
        var n = 0
        for (y in 1 until h - 1) {
            for (x in 1 until w - 1) {
                val i = y * w + x
                val v = (
                    -gray[i - w - 1] - gray[i - w] - gray[i - w + 1] -
                        gray[i - 1] + 8 * gray[i] - gray[i + 1] -
                        gray[i + w - 1] - gray[i + w] - gray[i + w + 1]
                    ).toDouble()
                sum += v
                sumSq += v * v
                n++
            }
        }
        val mean = if (n > 0) sum / n else 0.0
        val variance = if (n > 0) sumSq / n - mean * mean else 0.0
        val sharpness = if (variance > 0) variance else 0.0
        val borderEdgeFraction = borderHighContrastFraction(gray, w, h)

        val issue = when {
            sharpness < SHARPNESS_FLOOR -> "Image is too blurry. Hold the phone steady and tap capture again."
            meanLuminance < LUMINANCE_MIN -> "Scene is too dark. Add light over the reference and foot."
            meanLuminance > LUMINANCE_MAX -> "Scene is overexposed. Reduce glare and try again."
            shadowFraction > CLIPPED_FRACTION_MAX -> "Severe shadows detected. Even out lighting over the reference."
            highlightFraction > CLIPPED_FRACTION_MAX -> "Glare detected on the reference. Tilt slightly to reduce reflections."
            borderEdgeFraction > BORDER_EDGE_MAX ->
                "Subject looks clipped by the frame. Step back so the full foot and reference are visible."
            else -> null
        }
        return ImageQuality(
            sharpness = sharpness,
            meanLuminance = meanLuminance,
            shadowFraction = shadowFraction,
            highlightFraction = highlightFraction,
            borderEdgeFraction = borderEdgeFraction,
            ok = issue == null,
            issue = issue,
        )
    }

    /** Fraction of border-band pixels with strong local contrast (clipping proxy). */
    private fun borderHighContrastFraction(gray: IntArray, w: Int, h: Int): Double {
        if (w < 16 || h < 16) return 0.0
        val band = maxOf(2, minOf(w, h) / 20)
        var edgeHits = 0
        var samples = 0
        fun sample(x: Int, y: Int) {
            val i = y * w + x
            val left = gray[i - 1]
            val right = gray[i + 1]
            val up = gray[i - w]
            val down = gray[i + w]
            val grad = abs(left - right) + abs(up - down)
            if (grad > 80) edgeHits++
            samples++
        }
        for (y in band until h - band) {
            for (x in 1 until band) sample(x, y)
            for (x in w - band until w - 1) sample(x, y)
        }
        for (x in band until w - band) {
            for (y in 1 until band) sample(x, y)
            for (y in h - band until h - 1) sample(x, y)
        }
        return if (samples == 0) 0.0 else edgeHits.toDouble() / samples
    }

    companion object {
        private const val MAX_PROBE_WIDTH = 320
        private const val SHARPNESS_FLOOR = 55.0
        private const val LUMINANCE_MIN = 35.0
        private const val LUMINANCE_MAX = 235.0
        private const val CLIPPED_FRACTION_MAX = 0.3
        private const val BORDER_EDGE_MAX = 0.45
    }
}
