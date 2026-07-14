package com.fitsense.ai.repository

import com.fitsense.ai.firebase.FirestoreService
import com.fitsense.ai.models.Product
import com.fitsense.ai.recommendation.ShoeCatalog
import com.fitsense.ai.utils.DataResult
import javax.inject.Inject

/**
 * Loads the product catalogue. Tries Firestore first; if that fails (no network,
 * empty collection in fresh projects) falls back to the bundled [ShoeCatalog].
 */
interface ProductRepository {
    suspend fun getAllProducts(): DataResult<List<Product>>
}

class ProductRepositoryImpl @Inject constructor(
    private val firestore: FirestoreService,
    private val catalog: ShoeCatalog,
) : ProductRepository {

    override suspend fun getAllProducts(): DataResult<List<Product>> {
        return when (val remote = firestore.getProducts()) {
            is DataResult.Success ->
                if (remote.value.isNotEmpty()) remote
                else DataResult.Success(catalog.builtIn())
            is DataResult.Failure -> DataResult.Success(catalog.builtIn())
        }
    }
}
