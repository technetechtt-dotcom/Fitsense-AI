package com.fitsense.ai.ar

import android.app.Activity
import android.content.Context
import com.fitsense.ai.utils.Constants
import com.google.ar.core.ArCoreApk
import com.google.ar.core.Config
import com.google.ar.core.Plane
import com.google.ar.core.Session
import com.google.ar.core.TrackingState
import com.google.ar.core.exceptions.UnavailableException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Owns the ARCore [Session] lifecycle.
 *
 * The session is created lazily (so we can defer the install prompt until the
 * user actually presses "Start scan") and surfaces a [planeDetectionState] that
 * powers UI hints in the scan screen.
 *
 * This class is intentionally GL-renderer-free: the scan screen uses ARCore
 * only for plane / camera-intrinsics data, while the visible camera feed
 * is provided by CameraX. That keeps the MVP simple.
 */
@Singleton
class ArCoreSessionManager @Inject constructor() {

    @Volatile private var session: Session? = null

    private val _planeDetectionState = MutableStateFlow<PlaneDetectionState>(PlaneDetectionState.Idle)
    val planeDetectionState: StateFlow<PlaneDetectionState> = _planeDetectionState.asStateFlow()

    /** Returns true if ARCore is installed (and not pending install). */
    fun isArCoreAvailable(context: Context): Boolean {
        return when (ArCoreApk.getInstance().checkAvailability(context)) {
            ArCoreApk.Availability.SUPPORTED_INSTALLED -> true
            else -> false
        }
    }

    /**
     * Request install of ARCore Services if needed. Must be called from an
     * Activity context.
     */
    fun requestInstallIfNeeded(activity: Activity, userRequested: Boolean): ArCoreApk.InstallStatus =
        ArCoreApk.getInstance().requestInstall(activity, userRequested)

    /**
     * Idempotently create + resume an ARCore session.
     *
     * Throws [UnavailableException] subclasses if the device cannot run ARCore;
     * callers should switch to the reference-card calibration path.
     */
    @Throws(UnavailableException::class)
    fun resume(context: Context): Session {
        val existing = session
        if (existing != null) {
            existing.resume()
            return existing
        }
        val s = Session(context).apply {
            configure(
                Config(this).apply {
                    planeFindingMode = Config.PlaneFindingMode.HORIZONTAL
                    updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
                    focusMode = Config.FocusMode.AUTO
                    lightEstimationMode = Config.LightEstimationMode.AMBIENT_INTENSITY
                },
            )
            resume()
        }
        session = s
        _planeDetectionState.value = PlaneDetectionState.Searching
        return s
    }

    fun pause() {
        // Lambda receiver is `Session`, so `pause()` here resolves to Session.pause().
        // Made explicit with `it` to avoid confusion with the surrounding method.
        session?.let { s ->
            runCatching { s.pause() }.onFailure { Timber.e(it, "ARCore pause failed") }
        }
    }

    fun close() {
        session?.close()
        session = null
        _planeDetectionState.value = PlaneDetectionState.Idle
    }

    /**
     * Pulls the next frame, inspects detected planes, and updates
     * [planeDetectionState] accordingly. Call this from a render / analysis loop.
     */
    fun updatePlaneState() {
        val s = session ?: return
        val frame = runCatching { s.update() }.getOrNull() ?: run {
            _planeDetectionState.value = PlaneDetectionState.Lost
            return
        }
        if (frame.camera.trackingState != TrackingState.TRACKING) {
            _planeDetectionState.value = PlaneDetectionState.Searching
            return
        }
        val bestPlane = s.getAllTrackables(Plane::class.java)
            .asSequence()
            .filter { it.trackingState == TrackingState.TRACKING }
            .filter { it.type == Plane.Type.HORIZONTAL_UPWARD_FACING }
            .filter { it.extentX * it.extentZ >= Constants.MIN_PLANE_AREA_M2 }
            .maxByOrNull { it.extentX * it.extentZ }

        _planeDetectionState.value = if (bestPlane != null) {
            val cameraPose = frame.camera.pose
            val planePose = bestPlane.centerPose
            val dx = cameraPose.tx() - planePose.tx()
            val dy = cameraPose.ty() - planePose.ty()
            val dz = cameraPose.tz() - planePose.tz()
            val distance = kotlin.math.sqrt(dx * dx + dy * dy + dz * dz)
            PlaneDetectionState.Found(
                planeAreaM2 = bestPlane.extentX * bestPlane.extentZ,
                distanceMeters = distance,
            )
        } else {
            PlaneDetectionState.Searching
        }
    }

    fun activeSession(): Session? = session
}
