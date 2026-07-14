package com.fitsense.ai.firebase

import com.fitsense.ai.models.Product
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.utils.AppError
import com.fitsense.ai.utils.DataResult
import com.fitsense.ai.utils.safeCall
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * CRUD-style facade over Firestore. Keeps all collection paths and Kotlin
 * <-> Firestore mapping in one place so the repositories stay tidy.
 */
@Singleton
class FirestoreService @Inject constructor(
    private val db: FirebaseFirestore,
) {

    // ---------------- Users --------------------------------------------------

    suspend fun upsertUser(profile: UserProfile): DataResult<Unit> = safeCall(::firestoreError) {
        db.collection(FirestoreCollections.USERS)
            .document(profile.userId)
            .set(profile.toMap())
            .await()
    }

    suspend fun getUser(userId: String): DataResult<UserProfile?> = safeCall(::firestoreError) {
        val snap = db.collection(FirestoreCollections.USERS).document(userId).get().await()
        if (snap.exists()) snap.data?.toUserProfile(userId) else null
    }

    // ---------------- Scans --------------------------------------------------

    suspend fun saveScan(scan: ScanResult): DataResult<Unit> = safeCall(::firestoreError) {
        db.collection(FirestoreCollections.USERS)
            .document(scan.userId)
            .collection(FirestoreCollections.SCANS)
            .document(scan.scanId)
            .set(scan.toMap())
            .await()
    }

    suspend fun deleteScan(userId: String, scanId: String): DataResult<Unit> = safeCall(::firestoreError) {
        db.collection(FirestoreCollections.USERS)
            .document(userId)
            .collection(FirestoreCollections.SCANS)
            .document(scanId)
            .delete()
            .await()
    }

    /** Live list of scans, ordered newest-first. */
    fun observeScans(userId: String): Flow<List<ScanResult>> = callbackFlow {
        val reg = db.collection(FirestoreCollections.USERS)
            .document(userId)
            .collection(FirestoreCollections.SCANS)
            .orderBy("createdAtEpochMs", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                val scans = snap?.documents?.mapNotNull { it.data?.toScanResult(it.id) } ?: emptyList()
                trySend(scans)
            }
        awaitClose { reg.remove() }
    }

    // ---------------- Products -----------------------------------------------

    suspend fun getProducts(): DataResult<List<Product>> = safeCall(::firestoreError) {
        val docs = db.collection(FirestoreCollections.PRODUCTS).get().await()
        docs.documents.mapNotNull { it.data?.toProduct(it.id) }
    }

    private fun firestoreError(t: Throwable): AppError =
        AppError.Network(t.message ?: "Firestore error", t)
}

// ----- Mapping helpers -------------------------------------------------------
// Manual mappers are used (instead of @PropertyName/auto-mapping) so the model
// classes can stay pure Kotlin data classes with default values + serialization.

private fun UserProfile.toMap(): Map<String, Any?> = mapOf(
    "userId" to userId,
    "displayName" to displayName,
    "email" to email,
    "isAnonymous" to isAnonymous,
    "cachedFootLengthMm" to cachedFootLengthMm,
    "cachedFootWidthMm" to cachedFootWidthMm,
    "createdAtEpochMs" to createdAtEpochMs,
    "updatedAtEpochMs" to updatedAtEpochMs,
    "preferences" to mapOf(
        "units" to preferences.units.name,
        "defaultCalibration" to preferences.defaultCalibration.name,
        "analyticsOptIn" to preferences.analyticsOptIn,
        "preferredBrands" to preferences.preferredBrands,
    ),
)

private fun Map<String, Any?>.toUserProfile(id: String): UserProfile {
    val prefs = (get("preferences") as? Map<*, *>) ?: emptyMap<Any?, Any?>()
    return UserProfile(
        userId = id,
        displayName = get("displayName") as? String,
        email = get("email") as? String,
        isAnonymous = (get("isAnonymous") as? Boolean) ?: true,
        cachedFootLengthMm = (get("cachedFootLengthMm") as? Number)?.toDouble(),
        cachedFootWidthMm = (get("cachedFootWidthMm") as? Number)?.toDouble(),
        createdAtEpochMs = (get("createdAtEpochMs") as? Number)?.toLong() ?: System.currentTimeMillis(),
        updatedAtEpochMs = (get("updatedAtEpochMs") as? Number)?.toLong() ?: System.currentTimeMillis(),
        preferences = com.fitsense.ai.models.UserPreferences(
            units = runCatching {
                com.fitsense.ai.models.MeasurementUnit.valueOf(prefs["units"] as String)
            }.getOrElse { com.fitsense.ai.models.MeasurementUnit.MILLIMETRES },
            defaultCalibration = runCatching {
                com.fitsense.ai.models.CalibrationReference.valueOf(prefs["defaultCalibration"] as String)
            }.getOrElse { com.fitsense.ai.models.CalibrationReference.A4_PAPER },
            analyticsOptIn = (prefs["analyticsOptIn"] as? Boolean) ?: false,
            @Suppress("UNCHECKED_CAST")
            preferredBrands = (prefs["preferredBrands"] as? List<String>) ?: emptyList(),
        ),
    )
}

private fun ScanResult.toMap(): Map<String, Any?> = mapOf(
    "scanId" to scanId,
    "userId" to userId,
    "createdAtEpochMs" to createdAtEpochMs,
    "leftFoot" to leftFoot?.toMap(),
    "rightFoot" to rightFoot?.toMap(),
    "recommendation" to recommendation?.toMap(),
    "thumbnailUrl" to thumbnailUrl,
    "deviceModel" to deviceModel,
    "arcoreUsed" to arcoreUsed,
)

private fun Map<String, Any?>.toScanResult(id: String): ScanResult? = runCatching {
    ScanResult(
        scanId = id,
        userId = get("userId") as String,
        createdAtEpochMs = (get("createdAtEpochMs") as? Number)?.toLong() ?: System.currentTimeMillis(),
        leftFoot = (get("leftFoot") as? Map<*, *>)?.toFootMeasurement(),
        rightFoot = (get("rightFoot") as? Map<*, *>)?.toFootMeasurement(),
        recommendation = (get("recommendation") as? Map<*, *>)?.toSizeRecommendation(),
        thumbnailUrl = get("thumbnailUrl") as? String,
        deviceModel = get("deviceModel") as? String,
        arcoreUsed = (get("arcoreUsed") as? Boolean) ?: false,
    )
}.getOrNull()

private fun com.fitsense.ai.models.FootMeasurement.toMap(): Map<String, Any?> = mapOf(
    "lengthMm" to lengthMm,
    "widthMm" to widthMm,
    "archHeightMm" to archHeightMm,
    "confidence" to confidence,
    "foot" to foot.name,
    "calibration" to calibration.name,
    "pixelsPerMm" to pixelsPerMm,
)

private fun Map<*, *>.toFootMeasurement(): com.fitsense.ai.models.FootMeasurement {
    return com.fitsense.ai.models.FootMeasurement(
        lengthMm = (get("lengthMm") as Number).toDouble(),
        widthMm = (get("widthMm") as Number).toDouble(),
        archHeightMm = (get("archHeightMm") as? Number)?.toDouble(),
        confidence = (get("confidence") as? Number)?.toFloat() ?: 0f,
        foot = runCatching {
            com.fitsense.ai.models.Foot.valueOf(get("foot") as String)
        }.getOrElse { com.fitsense.ai.models.Foot.UNKNOWN },
        calibration = runCatching {
            com.fitsense.ai.models.CalibrationReference.valueOf(get("calibration") as String)
        }.getOrElse { com.fitsense.ai.models.CalibrationReference.ARCORE_PLANE },
        pixelsPerMm = (get("pixelsPerMm") as? Number)?.toDouble() ?: 0.0,
    )
}

private fun com.fitsense.ai.models.SizeRecommendation.toMap(): Map<String, Any?> = mapOf(
    "uk" to uk,
    "us" to us,
    "eu" to eu,
    "mondopointMm" to mondopointMm,
    "matches" to matches.map {
        mapOf(
            "productId" to it.productId,
            "brand" to it.brand,
            "model" to it.model,
            "recommendedEuSize" to it.recommendedEuSize,
            "fitScore" to it.fitScore,
            "comfortScore" to it.comfortScore,
            "imageUrl" to it.imageUrl,
        )
    },
)

private fun Map<*, *>.toSizeRecommendation(): com.fitsense.ai.models.SizeRecommendation {
    @Suppress("UNCHECKED_CAST")
    val rawMatches = (get("matches") as? List<Map<String, Any?>>) ?: emptyList()
    return com.fitsense.ai.models.SizeRecommendation(
        uk = (get("uk") as? String) ?: "",
        us = (get("us") as? String) ?: "",
        eu = (get("eu") as? String) ?: "",
        mondopointMm = (get("mondopointMm") as? Number)?.toInt() ?: 0,
        matches = rawMatches.map {
            com.fitsense.ai.models.ShoeMatch(
                productId = it["productId"] as String,
                brand = it["brand"] as String,
                model = it["model"] as String,
                recommendedEuSize = (it["recommendedEuSize"] as Number).toDouble(),
                fitScore = (it["fitScore"] as Number).toInt(),
                comfortScore = (it["comfortScore"] as Number).toInt(),
                imageUrl = it["imageUrl"] as? String,
            )
        },
    )
}

private fun Map<String, Any?>.toProduct(id: String): Product? = runCatching {
    val range = get("sizeRangeEu") as Map<*, *>
    Product(
        productId = id,
        brand = get("brand") as String,
        model = get("model") as String,
        category = runCatching {
            com.fitsense.ai.models.ShoeCategory.valueOf(get("category") as String)
        }.getOrElse { com.fitsense.ai.models.ShoeCategory.SNEAKER },
        fitType = runCatching {
            com.fitsense.ai.models.FitType.valueOf(get("fitType") as String)
        }.getOrElse { com.fitsense.ai.models.FitType.STANDARD },
        sizeRangeEu = com.fitsense.ai.models.SizeRange(
            min = (range["min"] as Number).toDouble(),
            max = (range["max"] as Number).toDouble(),
            step = (range["step"] as? Number)?.toDouble() ?: 1.0,
        ),
        priceUsd = (get("priceUsd") as? Number)?.toDouble() ?: 0.0,
        imageUrl = get("imageUrl") as? String,
        description = (get("description") as? String) ?: "",
        @Suppress("UNCHECKED_CAST")
        colorways = (get("colorways") as? List<String>) ?: emptyList(),
    )
}.getOrNull()
