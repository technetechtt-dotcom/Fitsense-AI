package com.fitsense.ai.measurement

import com.fitsense.ai.models.MeasurementUnit
import com.fitsense.ai.utils.roundTo
import javax.inject.Inject

/** Converts mm <-> inches with a single decimal of precision for display. */
class UnitConverter @Inject constructor() {

    fun format(mm: Double, unit: MeasurementUnit): String = when (unit) {
        MeasurementUnit.MILLIMETRES -> "${mm.roundTo(1)} mm"
        MeasurementUnit.INCHES -> "${(mm / MM_PER_INCH).roundTo(2)} in"
    }

    fun mmToInches(mm: Double): Double = mm / MM_PER_INCH
    fun inchesToMm(inches: Double): Double = inches * MM_PER_INCH

    private companion object { const val MM_PER_INCH = 25.4 }
}
