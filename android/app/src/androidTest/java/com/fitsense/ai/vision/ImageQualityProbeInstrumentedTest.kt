package com.fitsense.ai.vision

import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Image-quality fixture using a synthetic bitmap (no committed binary fixture required).
 */
@RunWith(AndroidJUnit4::class)
class ImageQualityProbeInstrumentedTest {
  private val probe = ImageQualityProbe()

  @Test
  fun sharpUniformFramePasses() {
    val bitmap = Bitmap.createBitmap(320, 240, Bitmap.Config.ARGB_8888)
    bitmap.eraseColor(Color.LTGRAY)
    val quality = probe.probe(bitmap)
    bitmap.recycle()
    assertTrue(quality.ok)
    assertTrue(quality.sharpness >= 0.0)
  }

  @Test
  fun darkFrameFails() {
    val bitmap = Bitmap.createBitmap(320, 240, Bitmap.Config.ARGB_8888)
    bitmap.eraseColor(Color.BLACK)
    val quality = probe.probe(bitmap)
    bitmap.recycle()
    assertFalse(quality.ok)
  }
}
