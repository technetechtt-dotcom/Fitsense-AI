package com.fitsense.ai.recommendation

import com.fitsense.ai.api.MerchantApiClient
import com.fitsense.ai.api.MerchantPrefs
import com.fitsense.ai.models.Product
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Active recommendation catalogue: merchant org products when loaded,
 * otherwise the bundled demo shelf. SKUs only — never invents millimetres.
 */
@Singleton
class CatalogueRuntime @Inject constructor(
    private val merchantApi: MerchantApiClient,
    private val merchantPrefs: MerchantPrefs,
    private val shoeCatalog: ShoeCatalog,
) {
    @Volatile
    private var merchantProducts: List<Product>? = null

    @Volatile
    private var inventoryLoaded: Boolean = false

    fun getActiveCatalogue(): List<Product> {
        val merchant = merchantProducts
        return if (!merchant.isNullOrEmpty()) merchant else shoeCatalog.builtIn()
    }

    fun source(): String =
        if (!merchantProducts.isNullOrEmpty()) "merchant" else "builtin"

    fun clear() {
        merchantProducts = null
        inventoryLoaded = false
    }

    /**
     * Loads catalogue for the configured merchant org.
     * @return number of products loaded (0 keeps / restores builtin shelf).
     */
    suspend fun loadFromConfig(): Int {
        val orgId = merchantPrefs.orgId() ?: run {
            clear()
            return 0
        }
        val products = merchantApi.listCatalogue(orgId)
        if (products.isNullOrEmpty()) {
            clear()
            return 0
        }
        merchantProducts = products
        // Inventory fetch is best-effort (stock hints can be added later).
        runCatching { merchantApi.listInventory(orgId) }
        inventoryLoaded = true
        return products.size
    }
}
