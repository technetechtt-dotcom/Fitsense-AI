package com.fitsense.ai.vision

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.opencv.android.OpenCVLoader
import timber.log.Timber

/**
 * Loads the OpenCV native library off the main thread.
 *
 * Compose screens that need OpenCV (scan / results) observe [isReady] and show
 * a "preparing engines" indicator while the native lib finishes loading.
 */
class OpenCvInitializer {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _isReady = MutableStateFlow(false)
    val isReady: StateFlow<Boolean> = _isReady.asStateFlow()

    fun initializeAsync() {
        if (_isReady.value) return
        scope.launch {
            val ok = try {
                OpenCVLoader.initLocal()
            } catch (t: Throwable) {
                Timber.tag(TAG).e(t, "OpenCV initLocal() failed")
                false
            }
            if (ok) {
                Timber.tag(TAG).i("OpenCV native library loaded")
            } else {
                Timber.tag(TAG).w("OpenCV could not load — vision pipeline will be disabled")
            }
            _isReady.value = ok
        }
    }

    private companion object { const val TAG = "OpenCV" }
}
