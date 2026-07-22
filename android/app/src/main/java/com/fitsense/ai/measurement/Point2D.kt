package com.fitsense.ai.measurement

import kotlin.math.hypot

data class Point2D(val x: Double, val y: Double)

fun distance(a: Point2D, b: Point2D): Double = hypot(a.x - b.x, a.y - b.y)

fun quadArea(points: List<Point2D>): Double {
    require(points.size == 4)
    var sum = 0.0
    for (i in 0 until 4) {
        val a = points[i]
        val b = points[(i + 1) % 4]
        sum += a.x * b.y - b.x * a.y
    }
    return kotlin.math.abs(sum) / 2.0
}

/** Sort four corners top-left → top-right → bottom-right → bottom-left. */
fun sortCornersTopLeft(points: List<Point2D>): List<Point2D> {
    require(points.size == 4)
    val bySum = points.sortedBy { it.x + it.y }
    val byDiff = points.sortedBy { it.y - it.x }
    val tl = bySum.first()
    val br = bySum.last()
    val tr = byDiff.first()
    val bl = byDiff.last()
    return listOf(tl, tr, br, bl)
}
