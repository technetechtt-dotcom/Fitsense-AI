package com.fitsense.ai.camera

import android.content.Context
import android.util.Size
import androidx.camera.core.AspectRatio
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.suspendCancellableCoroutine
import timber.log.Timber
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Thin lifecycle-aware wrapper around CameraX.
 *
 * Compose calls [bind] inside `AndroidView { PreviewView(...) }` and disposes
 * via [unbind] from `DisposableEffect`. Frames intended for OpenCV are routed
 * through [analyzeFrames] which exposes an [ImageProxy] callback running on a
 * dedicated background thread.
 */
@Singleton
class CameraXController @Inject constructor() {

    private var cameraProvider: ProcessCameraProvider? = null
    private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var imageCapture: ImageCapture? = null

    suspend fun bind(
        context: Context,
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView,
        analyzer: (ImageProxy) -> Unit = { it.close() },
    ) = suspendCancellableCoroutine<Unit> { cont ->
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener(
            {
                try {
                    val provider = future.get()
                    cameraProvider = provider

                    val selector = ResolutionSelector.Builder()
                        .setResolutionStrategy(
                            ResolutionStrategy(
                                Size(1280, 960),
                                ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER,
                            ),
                        )
                        .build()

                    val preview = Preview.Builder()
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .setResolutionSelector(selector)
                        .build()
                        .also { it.setSurfaceProvider(previewView.surfaceProvider) }

                    val capture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .setResolutionSelector(selector)
                        .build()
                    imageCapture = capture

                    val analysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setResolutionSelector(selector)
                        .build()
                        .also { it.setAnalyzer(analysisExecutor, analyzer) }

                    provider.unbindAll()
                    provider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview, capture, analysis,
                    )
                    cont.resume(Unit)
                } catch (t: Throwable) {
                    Timber.e(t, "CameraX bind failed")
                    cont.resumeWithException(t)
                }
            },
            ContextCompat.getMainExecutor(context),
        )
        cont.invokeOnCancellation { unbind() }
    }

    /** Capture a still JPEG and return the in-memory bytes. */
    suspend fun captureStill(): ByteArray = suspendCancellableCoroutine { cont ->
        val capture = imageCapture
            ?: return@suspendCancellableCoroutine cont.resumeWithException(
                IllegalStateException("Camera not bound"),
            )

        capture.takePicture(
            analysisExecutor,
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    try {
                        val buffer = image.planes[0].buffer
                        val bytes = ByteArray(buffer.remaining()).also { buffer.get(it) }
                        cont.resume(bytes)
                    } finally {
                        image.close()
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    cont.resumeWithException(exception)
                }
            },
        )
    }

    fun unbind() {
        cameraProvider?.unbindAll()
        cameraProvider = null
        imageCapture = null
    }

    fun shutdown() {
        unbind()
        analysisExecutor.shutdown()
    }
}
