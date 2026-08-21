package com.fitsense.ai.recommendation

import com.fitsense.ai.api.MerchantApiClient
import com.fitsense.ai.models.FitType
import kotlin.math.abs

/**
 * Stock ranking helpers. Prefer exact size + width match when inventory is loaded.
 */
class InventoryStockIndex(
    private val rows: List<MerchantApiClient.InventoryItemDto> = emptyList(),
) {
    fun hasInventory(): Boolean = rows.isNotEmpty()

    fun productHasAnyStock(productId: String): Boolean? {
        if (rows.isEmpty()) return null
        val matched = rows.filter { it.productId == productId }
        if (matched.isEmpty()) return false
        return matched.any { it.quantity > 0 }
    }

    /**
     * True when an inventory row matches the recommended EU size (or mapped UK/US)
     * and width for [fitType].
     */
    fun inStockExact(
        productId: String,
        recommendedEu: Double,
        fitType: FitType,
    ): Boolean? {
        if (rows.isEmpty()) return null
        val matched = rows.filter { it.productId == productId }
        if (matched.isEmpty()) return false
        val width = widthLabelFor(fitType)
        val sizes = SizeMappingTable.sizeForEu(recommendedEu)
        val euLabel = formatSizeLabel(recommendedEu)
        return matched.any { row ->
            if (row.quantity <= 0) return@any false
            if (!widthMatches(row.widthLabel, width)) return@any false
            when (row.sizeSystem.lowercase()) {
                "eu" -> labelsEqual(row.sizeLabel, euLabel) ||
                    labelsEqual(row.sizeLabel, sizes.eu)
                "uk" -> labelsEqual(row.sizeLabel, sizes.uk)
                "us" -> labelsEqual(row.sizeLabel, sizes.us)
                "mondopoint" -> labelsEqual(row.sizeLabel, sizes.mondopointMm.toString())
                else -> false
            }
        }
    }

    fun inStockUkLabels(productId: String): List<String> {
        if (rows.isEmpty()) return emptyList()
        return rows
            .asSequence()
            .filter { it.productId == productId && it.sizeSystem == "uk" && it.quantity > 0 }
            .map { it.sizeLabel }
            .distinct()
            .sortedWith(compareBy({ it.toDoubleOrNull() ?: Double.MAX_VALUE }, { it }))
            .toList()
    }

    companion object {
        fun widthLabelFor(fitType: FitType): String = when (fitType) {
            FitType.NARROW -> "narrow"
            FitType.WIDE -> "wide"
            FitType.EXTRA_WIDE -> "extra_wide"
            FitType.STANDARD -> "standard"
        }

        fun formatSizeLabel(eu: Double): String =
            if (abs(eu - eu.toInt()) < 1e-6) eu.toInt().toString()
            else eu.toString().trimEnd('0').trimEnd('.')

        fun labelsEqual(a: String, b: String): Boolean {
            val na = a.trim().replace(',', '.').toDoubleOrNull()
            val nb = b.trim().replace(',', '.').toDoubleOrNull()
            if (na != null && nb != null) return abs(na - nb) < 1e-6
            return a.trim().equals(b.trim(), ignoreCase = true)
        }

        fun widthMatches(inventoryWidth: String, expected: String): Boolean {
            val left = inventoryWidth.trim().lowercase().ifEmpty { "standard" }
            val right = expected.trim().lowercase().ifEmpty { "standard" }
            if (left == right) return true
            val aliases = mapOf(
                "regular" to "standard",
                "std" to "standard",
                "d" to "standard",
                "ee" to "wide",
                "eee" to "extra_wide",
                "extra-wide" to "extra_wide",
                "xw" to "extra_wide",
            )
            val normLeft = aliases[left] ?: left
            val normRight = aliases[right] ?: right
            return normLeft == normRight
        }
    }
}
