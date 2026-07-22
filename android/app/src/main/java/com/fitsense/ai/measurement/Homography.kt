package com.fitsense.ai.measurement

typealias Mat3 = Array<DoubleArray>

object Homography {
    fun compute(src: List<Point2D>, dst: List<Point2D>): Mat3 {
        require(src.size == 4 && dst.size == 4) { "Need exactly 4 correspondences" }
        val a = Array(8) { DoubleArray(8) }
        val b = DoubleArray(8)
        for (i in 0 until 4) {
            val (x, y) = src[i]
            val (X, Y) = dst[i]
            a[i * 2] = doubleArrayOf(x, y, 1.0, 0.0, 0.0, 0.0, -X * x, -X * y)
            b[i * 2] = X
            a[i * 2 + 1] = doubleArrayOf(0.0, 0.0, 0.0, x, y, 1.0, -Y * x, -Y * y)
            b[i * 2 + 1] = Y
        }
        val h = solveLinearSystem(a, b)
        return arrayOf(
            doubleArrayOf(h[0], h[1], h[2]),
            doubleArrayOf(h[3], h[4], h[5]),
            doubleArrayOf(h[6], h[7], 1.0),
        )
    }

    fun apply(H: Mat3, p: Point2D): Point2D {
        val w = H[2][0] * p.x + H[2][1] * p.y + H[2][2]
        return Point2D(
            x = (H[0][0] * p.x + H[0][1] * p.y + H[0][2]) / w,
            y = (H[1][0] * p.x + H[1][1] * p.y + H[1][2]) / w,
        )
    }

    private fun solveLinearSystem(a: Array<DoubleArray>, b: DoubleArray): DoubleArray {
        val n = a.size
        val m = Array(n) { i -> a[i].copyOf(n + 1).also { it[n] = b[i] } }
        for (col in 0 until n) {
            var pivot = col
            for (row in col + 1 until n) {
                if (kotlin.math.abs(m[row][col]) > kotlin.math.abs(m[pivot][col])) pivot = row
            }
            if (kotlin.math.abs(m[pivot][col]) < 1e-10) {
                throw IllegalArgumentException("Degenerate homography — corners may be colinear")
            }
            if (pivot != col) {
                val tmp = m[col]
                m[col] = m[pivot]
                m[pivot] = tmp
            }
            val div = m[col][col]
            for (j in col..n) m[col][j] /= div
            for (row in 0 until n) {
                if (row == col) continue
                val factor = m[row][col]
                for (j in col..n) m[row][j] -= factor * m[col][j]
            }
        }
        return DoubleArray(n) { m[it][n] }
    }
}
