package com.fitsense.ai.monitoring

import android.util.Log
import com.fitsense.ai.BuildConfig
import timber.log.Timber

/**
 * Lightweight crash / ops reporting. Plants a release Timber tree that
 * always logs locally; optional remote forwarding can be enabled later
 * via a DSN without changing call sites.
 */
object CrashReporting {
    fun install() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(ReleaseTree())
        }
    }

    private class ReleaseTree : Timber.Tree() {
        override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
            if (priority < Log.INFO) return
            Log.println(priority, tag ?: "FitSense", message)
            if (t != null) Log.e(tag ?: "FitSense", message, t)
        }
    }
}
