package com.fitsense.ai.recommendation

import com.fitsense.ai.BuildConfig
import com.fitsense.ai.models.FitType
import com.fitsense.ai.models.FootMeasurement
import com.fitsense.ai.models.Product
import com.fitsense.ai.models.ShoeMatch
import com.fitsense.ai.models.SizeRecommendation
import com.fitsense.ai.utils.Constants
import javax.inject.Inject
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Rule-based shoe recommendation engine.
 *
 * Inputs:
 *  • [FootMeasurement] — length + width in mm
 *  • Optional [Product] catalog
 *
 * Outputs:
 *  • Multi-locale size triplet (UK / US / EU) + Mondopoint
 *  • Sorted [ShoeMatch] list with fit + comfort scores 0..100
 */
class RecommendationEngine @Inject constructor(
    private val catalog: ShoeCatalog,
) {

    fun recommend(
        measurement: FootMeasurement,
        products: List<Product> = catalog.builtIn(),
        maxResults: Int = 8,
    ): SizeRecommendation {
        // Add heel-space margin so toes don't jam the toebox.
        val effectiveLengthMm = measurement.lengthMm + Constants.SIZE_HEEL_MARGIN_MM
        val sizes = SizeMappingTable.forLengthMm(effectiveLengthMm)
        val euSize = SizeMappingTable.euAsDouble(sizes.eu)

        val matches = products
            .asSequence()
            .filter { it.sizeRangeEu.contains(euSize) }
            .map { product -> buildMatch(product, measurement, euSize) }
            .sortedByDescending { it.fitScore + it.comfortScore }
            .take(maxResults)
            .toList()

        return SizeRecommendation(
            uk = sizes.uk,
            us = sizes.us,
            eu = sizes.eu,
            mondopointMm = sizes.mondopointMm,
            matches = matches,
        )
    }

    private fun buildMatch(
        product: Product,
        measurement: FootMeasurement,
        euSize: Double,
    ): ShoeMatch {
        // Snap user's EU size to the nearest step the product supports.
        val step = product.sizeRangeEu.step.coerceAtLeast(0.5)
        val recommendedSize = (
            ((euSize - product.sizeRangeEu.min) / step).roundToInt() * step + product.sizeRangeEu.min
        ).coerceIn(product.sizeRangeEu.min, product.sizeRangeEu.max)

        val fitScore = fitScore(product, measurement)
        val comfortScore = comfortScore(product, measurement, recommendedSize, euSize)

        return ShoeMatch(
            productId = product.productId,
            brand = product.brand,
            model = product.model,
            recommendedEuSize = recommendedSize,
            fitScore = fitScore,
            comfortScore = comfortScore,
            imageUrl = product.imageUrl,
        )
    }

    /**
     * Fit score weighs:
     *  • last width vs user's foot width-to-length ratio
     *  • wide-foot match bonus
     *  • measurement confidence floor
     */
    private fun fitScore(product: Product, foot: FootMeasurement): Int {
        val lastRatio = product.fitType.widthToLengthRatio
        val footRatio = foot.widthToLengthRatio
        val ratioDelta = abs(lastRatio - footRatio)

        // 0 mm delta = perfect; 0.06 ratio delta = 0 score.
        val ratioScore = (1.0 - (ratioDelta / 0.06)).coerceIn(0.0, 1.0)

        val wideFootBonus = when {
            foot.isWide && (product.fitType == FitType.WIDE || product.fitType == FitType.EXTRA_WIDE) -> 0.10
            foot.isWide && product.fitType == FitType.NARROW -> -0.15
            else -> 0.0
        }

        val confidenceFloor = (foot.confidence.toDouble() * 0.1)

        return ((ratioScore + wideFootBonus + confidenceFloor) * 100.0)
            .coerceIn(0.0, 100.0)
            .roundToInt()
    }

    /**
     * Comfort score: penalises when the recommended size is at the edge of the
     * product range, and rewards categories more suited to long wear.
     */
    private fun comfortScore(
        product: Product,
        foot: FootMeasurement,
        recommendedSize: Double,
        euSize: Double,
    ): Int {
        val range = product.sizeRangeEu
        val rangeMid = (range.min + range.max) / 2.0
        val rangeHalf = (range.max - range.min) / 2.0
        val centerness = (1.0 - abs(recommendedSize - rangeMid) / rangeHalf.coerceAtLeast(1e-3))
            .coerceIn(0.0, 1.0)

        val categoryBoost = when (product.category) {
            com.fitsense.ai.models.ShoeCategory.RUNNING,
            com.fitsense.ai.models.ShoeCategory.SNEAKER -> 0.08
            com.fitsense.ai.models.ShoeCategory.CASUAL -> 0.04
            else -> 0.0
        }

        // Penalize if user's foot exceeds the product's largest size by more than
        // the tolerance — that means it'll feel tight even at max.
        val sizingMismatchMm = (euSize - range.max).coerceAtLeast(0.0)
        val mismatchPenalty = (sizingMismatchMm * BuildConfig.FIT_SCORE_TOLERANCE_MM) / 100.0

        return ((centerness * 0.75 + categoryBoost + foot.confidence.toDouble() * 0.1 - mismatchPenalty) * 100.0)
            .coerceIn(0.0, 100.0)
            .roundToInt()
    }
}
