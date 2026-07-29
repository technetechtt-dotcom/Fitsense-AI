package com.fitsense.ai.repository

import com.fitsense.ai.models.Product
import com.fitsense.ai.recommendation.CatalogueRuntime
import com.fitsense.ai.utils.DataResult
import javax.inject.Inject

/**
 * Loads the product catalogue from merchant API when configured,
 * otherwise the bundled [com.fitsense.ai.recommendation.ShoeCatalog].
 */
interface ProductRepository {
    suspend fun getAllProducts(): DataResult<List<Product>>
}

class ProductRepositoryImpl @Inject constructor(
    private val catalogueRuntime: CatalogueRuntime,
) : ProductRepository {

    override suspend fun getAllProducts(): DataResult<List<Product>> =
        DataResult.Success(catalogueRuntime.getActiveCatalogue())
}
