package com.fitsense.ai.vision

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayInputStream
import javax.inject.Inject

/** Decode a JPEG capture and apply EXIF rotation so pixels are upright. */
class ImageOrientation @Inject constructor() {

    fun decodeUprightJpeg(jpegBytes: ByteArray): Bitmap {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size, bounds)
        val opts = BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }
        val raw = BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size, opts)
            ?: throw IllegalArgumentException("Could not decode captured image")
        val rotation = readExifRotation(jpegBytes)
        if (rotation == 0) return raw
        val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
        val upright = Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, matrix, true)
        if (upright !== raw) raw.recycle()
        return upright
    }

    private fun readExifRotation(jpegBytes: ByteArray): Int =
        runCatching {
            val exif = ExifInterface(ByteArrayInputStream(jpegBytes))
            when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        }.getOrDefault(0)
}
