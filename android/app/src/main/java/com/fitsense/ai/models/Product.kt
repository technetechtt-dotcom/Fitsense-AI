package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * Catalogue shoe. Stored in Firestore under top-level `products/{productId}`.
 *
 * `sizeRange` is expressed in the locale-agnostic EU system; the recommendation
 * engine converts the user's foot length into EU before filtering.
 */
@Serializable
data class Product(
    val productId: String,
    val brand: String,
    val model: String,
    val category: ShoeCategory = ShoeCategory.SNEAKER,
    val fitType: FitType = FitType.STANDARD,
    val sizeRangeEu: SizeRange,
    val priceUsd: Double = 0.0,
    val imageUrl: String? = null,
    val description: String = "",
    val colorways: List<String> = emptyList(),
)

@Serializable
data class SizeRange(val min: Double, val max: Double, val step: Double = 1.0) {
    fun contains(size: Double): Boolean = size in min..max
}

enum class ShoeCategory { SNEAKER, RUNNING, CASUAL, FORMAL, BOOT, SANDAL }

/**
 * Width / volume profile of a last (shoe shape).
 *
 * Used in combination with the user's [FootMeasurement.widthToLengthRatio] to
 * compute the fit score.
 */
enum class FitType(val widthToLengthRatio: Double) {
    NARROW(0.36),
    STANDARD(0.40),
    WIDE(0.44),
    EXTRA_WIDE(0.48),
}
