package com.fitsense.ai.vision;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import androidx.exifinterface.media.ExifInterface;
import java.io.ByteArrayInputStream;
import javax.inject.Inject;

/**
 * Decode a JPEG capture and apply EXIF rotation so pixels are upright.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001e\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0012\n\u0000\n\u0002\u0010\b\n\u0000\u0018\u00002\u00020\u0001B\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006J\u0010\u0010\u0007\u001a\u00020\b2\u0006\u0010\u0005\u001a\u00020\u0006H\u0002\u00a8\u0006\t"}, d2 = {"Lcom/fitsense/ai/vision/ImageOrientation;", "", "()V", "decodeUprightJpeg", "Landroid/graphics/Bitmap;", "jpegBytes", "", "readExifRotation", "", "app_debug"})
public final class ImageOrientation {
    
    @javax.inject.Inject()
    public ImageOrientation() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final android.graphics.Bitmap decodeUprightJpeg(@org.jetbrains.annotations.NotNull()
    byte[] jpegBytes) {
        return null;
    }
    
    private final int readExifRotation(byte[] jpegBytes) {
        return 0;
    }
}