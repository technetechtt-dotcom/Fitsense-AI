package com.fitsense.ai

import android.app.Application
import com.fitsense.ai.vision.OpenCvInitializer
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * FitSense AI application entry point.
 *
 * Responsibilities:
 *  • Bootstraps Hilt's object graph
 *  • Initializes Timber logging (debug only)
 *  • Triggers asynchronous OpenCV native library load so the vision pipeline
 *    is ready by the time the user enters the scan flow.
 */
@HiltAndroidApp
class FitSenseApp : Application() {

    @Inject lateinit var openCvInitializer: OpenCvInitializer
    @Inject lateinit var cloudSyncCoordinator: com.fitsense.ai.sync.CloudSyncCoordinator

    override fun onCreate() {
        super.onCreate()

        com.fitsense.ai.monitoring.CrashReporting.install()

        // Kick off native library load on a background thread; the scan
        // screen blocks until [OpenCvInitializer.isReady] flips true.
        openCvInitializer.initializeAsync()

        // Best-effort flush of durable outbox when the process starts.
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
            runCatching { cloudSyncCoordinator.flushOutbox() }
        }

        Timber.i("FitSense AI initialized (versionCode=${BuildConfig.VERSION_CODE})")
    }
}
