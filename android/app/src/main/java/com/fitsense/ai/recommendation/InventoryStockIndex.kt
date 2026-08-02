package com.fitsense.ai.recommendation

import com.fitsense.ai.api.MerchantApiClient

/**
 * Soft stock ranking helpers shared by recommendation. Empty index = no stock signal.
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
}
