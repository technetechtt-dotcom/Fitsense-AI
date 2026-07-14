package com.fitsense.ai.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.round

/** Small extension helpers used across feature modules. */

fun Double.roundTo(decimals: Int): Double {
    val factor = Math.pow(10.0, decimals.toDouble())
    return round(this * factor) / factor
}

fun Long.formatAsHumanDate(): String {
    val fmt = SimpleDateFormat("MMM d, yyyy · HH:mm", Locale.getDefault())
    return fmt.format(Date(this))
}

fun Float.coerceProgress(): Float = this.coerceIn(0f, 1f)

/** Maps a 0..1 confidence into a 0..100 integer percent for display. */
fun Float.toPercent(): Int = (this.coerceIn(0f, 1f) * 100f).toInt()
