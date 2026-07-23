package com.fitsense.ai.models

import kotlinx.serialization.Serializable

/**
 * Size recommendation snapshot. Sizes are stored as Strings so half-sizes
 * ("8.5") and locale variants ("EU 42") round-trip cleanly through Firestore.
 */
@Serializable
data class SizeRecommendation(
    val uk: String,
    val us: String,
    val eu: String,
    val mondopointMm: Int,
    val matches: List<ShoeMatch> = emptyList(),
    /** 0..1 — overall trust in publishing a retail size. */
    val recommendationConfidence: Float = 0f,
    /**
     * When true, UK/US/EU strings are empty and matches are empty —
     * measurement quality was too low to publish a retail size.
     */
    val sizeWithheld: Boolean = false,
    val withholdReason: String? = null,
)

@Serializable
data class ShoeMatch(
    val productId: String,
    val brand: String,
    val model: String,
    val recommendedEuSize: Double,
    /** 0..100 — how well the shoe last fits the user's foot geometry. */
    val fitScore: Int,
    /** 0..100 — broader comfort estimate (cushioning, drop, last shape). */
    val comfortScore: Int,
    val imageUrl: String? = null,
)
