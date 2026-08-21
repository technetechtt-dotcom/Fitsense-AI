package com.fitsense.ai.api

import com.fitsense.ai.auth.DeviceAuthClient
import com.fitsense.ai.models.FitType
import com.fitsense.ai.models.Product
import com.fitsense.ai.models.ShoeCategory
import com.fitsense.ai.models.SizeRange
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Merchant catalogue / inventory HTTP client (SKUs only — never invents mm).
 * Auth: device access token → mint short-lived catalogue token for GETs.
 */
@Singleton
class MerchantApiClient @Inject constructor(
    private val authClient: DeviceAuthClient,
    private val merchantPrefs: MerchantPrefs,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val tokenMutex = Mutex()
    private var cachedCatalogueToken: String? = null
    private var cachedCatalogueExpMs: Long = 0L
    private var cachedCatalogueOrgId: String? = null

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

    @Serializable
    private data class CatalogueTokenResponse(
        val token: String,
        val exp: Long,
    )

    suspend fun listCatalogue(orgId: String): List<Product>? = withContext(Dispatchers.IO) {
        val base = ApiConfig.baseUrl ?: return@withContext null
        val path = "$base/v1/merchants/orgs/${encode(orgId)}/catalogue"
        val body = get(path, orgId) ?: return@withContext null
        runCatching {
            json.decodeFromString<CatalogueResponse>(body).products.mapNotNull { it.toProduct() }
        }.getOrNull()
    }

    suspend fun listInventory(orgId: String): List<InventoryItemDto>? =
        withContext(Dispatchers.IO) {
            val base = ApiConfig.baseUrl ?: return@withContext null
            val path = "$base/v1/merchants/orgs/${encode(orgId)}/inventory"
            val body = get(path, orgId) ?: return@withContext null
            runCatching {
                json.decodeFromString<InventoryResponse>(body).items
            }.getOrNull()
        }

    private suspend fun ensureCatalogueToken(orgId: String): String? = tokenMutex.withLock {
        val now = System.currentTimeMillis()
        if (
            cachedCatalogueToken != null &&
            cachedCatalogueOrgId == orgId &&
            cachedCatalogueExpMs > now + 60_000
        ) {
            return cachedCatalogueToken
        }
        val base = ApiConfig.baseUrl ?: return null
        val access = authClient.ensureAccessToken() ?: return null
        val url = "$base/v1/merchants/orgs/${encode(orgId)}/catalogue-token"
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Authorization", "Bearer $access")
            connectTimeout = 15_000
            readTimeout = 15_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            outputStream.use { it.write("{}".toByteArray(Charsets.UTF_8)) }
        }
        return try {
            if (conn.responseCode !in 200..299) null
            else {
                val raw = conn.inputStream.bufferedReader().use { it.readText() }
                val parsed = json.decodeFromString<CatalogueTokenResponse>(raw)
                cachedCatalogueToken = parsed.token
                cachedCatalogueExpMs = parsed.exp
                cachedCatalogueOrgId = orgId
                parsed.token
            }
        } finally {
            conn.disconnect()
        }
    }

    private suspend fun get(url: String, orgId: String): String? {
        val catalogueToken = ensureCatalogueToken(orgId) ?: return null
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Authorization", "Bearer $catalogueToken")
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
        val range = sizeRangeEu ?: return null
        if (range.min >= range.max || range.step <= 0) return null
        return Product(
            productId = id,
            brand = b,
            model = m,
            category = mapCategory(category),
            fitType = mapFitType(fitType),
            sizeRangeEu = SizeRange(
                min = range.min,
                max = range.max,
                step = range.step,
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
