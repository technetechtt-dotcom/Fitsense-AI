package com.fitsense.ai.repository

import com.fitsense.ai.models.Product
import com.fitsense.ai.recommendation.ShoeCatalog
import com.fitsense.ai.utils.DataResult
import javax.inject.Inject

/**
 * Loads the product catalogue from the bundled [ShoeCatalog].
 */
interface ProductRepository {
    suspend fun getAllProducts(): DataResult<List<Product>>
}

class ProductRepositoryImpl @Inject constructor(
    private val catalog: ShoeCatalog,
) : ProductRepository {

    override suspend fun getAllProducts(): DataResult<List<Product>> =
        DataResult.Success(catalog.builtIn())
}
