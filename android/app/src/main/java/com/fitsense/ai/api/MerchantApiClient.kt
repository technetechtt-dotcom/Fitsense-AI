package com.fitsense.ai.api

import com.fitsense.ai.auth.DeviceAuthClient
import com.fitsense.ai.models.FitType
import com.fitsense.ai.models.Product
import com.fitsense.ai.models.ShoeCategory
import com.fitsense.ai.models.SizeRange
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Merchant catalogue / inventory HTTP client (SKUs only — never invents mm).
 */
@Singleton
class MerchantApiClient @Inject constructor(
    private val authClient: DeviceAuthClient,
    private val merchantPrefs: MerchantPrefs,
) {
    private val json = Json { ignoreUnknownKeys = true }

    @Serializable
    private data class CatalogueResponse(val products: List<CatalogueProductDto> = emptyList())

    @Serializable
    data class CatalogueProductDto(
        val productId: String,
        val brand: String,
        val model: String,
        val category: String? = null,
        val fitType: String? = null,
        val sizeRangeEu: SizeRangeDto? = null,
        val priceUsd: Double? = null,
        val description: String? = null,
        val colorways: List<String>? = null,
        val imageUrl: String? = null,
    )

    @Serializable
    data class SizeRangeDto(
        val min: Double,
        val max: Double,
        val step: Double = 1.0,
    )

    @Serializable
    private data class InventoryResponse(val items: List<InventoryItemDto> = emptyList())

    @Serializable
    data class InventoryItemDto(
        val productId: String,
        val sizeSystem: String,
        val sizeLabel: String,
        val widthLabel: String = "standard",
        val quantity: Int = 0,
    )

    suspend fun listCatalogue(orgId: String): List<Product>? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val path = "$base/v1/merchants/orgs/${encode(orgId)}/catalogue"
        val body = get(path) ?: return@withContext null
        runCatching {
            json.decodeFromString<CatalogueResponse>(body).products.mapNotNull { it.toProduct() }
        }.getOrNull()
    }

    suspend fun listInventory(orgId: String): List<InventoryItemDto>? =
        withContext(Dispatchers.IO) {
            val base = ApiConfig.baseUrl ?: return@withContext null
            val path = "$base/v1/merchants/orgs/${encode(orgId)}/inventory"
            val body = get(path) ?: return@withContext null
            runCatching {
                json.decodeFromString<InventoryResponse>(body).items
            }.getOrNull()
        }

    private suspend fun get(url: String): String? {
        val apiKey = merchantPrefs.apiKey()
        val bearer = if (apiKey.isNullOrBlank()) authClient.ensureAccessToken() else null
        if (apiKey.isNullOrBlank() && bearer.isNullOrBlank()) return null
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("Accept", "application/json")
            if (!apiKey.isNullOrBlank()) {
                setRequestProperty("X-Api-Key", apiKey)
            } else if (!bearer.isNullOrBlank()) {
                setRequestProperty("Authorization", "Bearer $bearer")
            }
            connectTimeout = 15_000
            readTimeout = 15_000
        }
        return try {
            if (conn.responseCode !in 200..299) null
            else conn.inputStream.bufferedReader().use { it.readText() }
        } finally {
            conn.disconnect()
        }
    }

    private fun encode(value: String): String =
        java.net.URLEncoder.encode(value, Charsets.UTF_8.name())

    private fun CatalogueProductDto.toProduct(): Product? {
        val id = productId.trim()
        val b = brand.trim()
        val m = model.trim()
        if (id.isEmpty() || b.isEmpty() || m.isEmpty()) return null
        val range = sizeRangeEu
        return Product(
            productId = id,
            brand = b,
            model = m,
            category = mapCategory(category),
            fitType = mapFitType(fitType),
            sizeRangeEu = SizeRange(
                min = range?.min ?: 30.0,
                max = range?.max ?: 46.0,
                step = if ((range?.step ?: 1.0) > 0) range?.step ?: 1.0 else 1.0,
            ),
            priceUsd = priceUsd ?: 0.0,
            imageUrl = imageUrl,
            description = description?.trim().orEmpty().ifEmpty { "$b $m" },
            colorways = colorways.orEmpty(),
        )
    }

    private fun mapCategory(raw: String?): ShoeCategory = when (raw?.trim()?.lowercase()) {
        "running" -> ShoeCategory.RUNNING
        "sneaker" -> ShoeCategory.SNEAKER
        "casual" -> ShoeCategory.CASUAL
        "formal" -> ShoeCategory.FORMAL
        "boot" -> ShoeCategory.BOOT
        "sandal" -> ShoeCategory.SANDAL
        "school" -> ShoeCategory.SCHOOL
        "safety" -> ShoeCategory.SAFETY
        else -> ShoeCategory.CASUAL
    }

    private fun mapFitType(raw: String?): FitType = when (raw?.trim()?.lowercase()) {
        "narrow" -> FitType.NARROW
        "wide" -> FitType.WIDE
        "extra_wide", "extra-wide" -> FitType.EXTRA_WIDE
        else -> FitType.STANDARD
    }
}
