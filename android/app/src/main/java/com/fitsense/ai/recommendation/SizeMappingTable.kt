package com.fitsense.ai.recommendation

import kotlin.math.roundToInt

/**
 * Static size-mapping table.
 *
 * Foot length (mm) → UK / US / EU / Mondopoint sizes for adult unisex sneakers.
 * Sourced from industry-standard charts (Nike, Adidas, ASICS) — close enough
 * for an MVP recommendation engine where the dominant error is measurement.
 *
 * Mondopoint is simply the foot length rounded to mm.
 */
internal object SizeMappingTable {

    private data class Row(
        val footLengthMmMax: Int, // upper bound; rows are ordered ascending
        val uk: String,
        val us: String,
        val eu: String,
    )

    private val rows = listOf(
        Row(220, "2", "3", "35"),
        Row(225, "2.5", "3.5", "35.5"),
        Row(230, "3", "4", "36"),
        Row(235, "3.5", "4.5", "36.5"),
        Row(240, "4", "5", "37"),
        Row(245, "4.5", "5.5", "37.5"),
        Row(250, "5", "6", "38"),
        Row(255, "5.5", "6.5", "38.5"),
        Row(260, "6", "7", "39"),
        Row(265, "6.5", "7.5", "40"),
        Row(270, "7", "8", "40.5"),
        Row(275, "7.5", "8.5", "41"),
        Row(280, "8", "9", "42"),
        Row(285, "8.5", "9.5", "42.5"),
        Row(290, "9", "10", "43"),
        Row(295, "9.5", "10.5", "44"),
        Row(300, "10", "11", "44.5"),
        Row(305, "10.5", "11.5", "45"),
        Row(310, "11", "12", "45.5"),
        Row(315, "11.5", "12.5", "46"),
        Row(320, "12", "13", "47"),
        Row(325, "12.5", "13.5", "47.5"),
        Row(330, "13", "14", "48"),
    )

    fun forLengthMm(lengthMm: Double): SizeTriplet {
        val mondopoint = lengthMm.roundToInt().coerceIn(180, 380)
        val row = rows.firstOrNull { mondopoint <= it.footLengthMmMax } ?: rows.last()
        return SizeTriplet(uk = row.uk, us = row.us, eu = row.eu, mondopointMm = mondopoint)
    }

    fun euAsDouble(eu: String): Double = eu.replace(",", ".").toDoubleOrNull() ?: 0.0
}

data class SizeTriplet(val uk: String, val us: String, val eu: String, val mondopointMm: Int)
