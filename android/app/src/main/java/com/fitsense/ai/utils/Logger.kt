package com.fitsense.ai.utils

import timber.log.Timber

/**
 * Thin wrapper so feature code can swap loggers without touching call sites.
 */
object Logger {
    fun d(tag: String, message: String) = Timber.tag(tag).d(message)
    fun i(tag: String, message: String) = Timber.tag(tag).i(message)
    fun w(tag: String, message: String, t: Throwable? = null) = Timber.tag(tag).w(t, message)
    fun e(tag: String, message: String, t: Throwable? = null) = Timber.tag(tag).e(t, message)
}
