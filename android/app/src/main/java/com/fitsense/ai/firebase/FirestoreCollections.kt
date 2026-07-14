package com.fitsense.ai.firebase

/** Single source of truth for Firestore document paths. */
internal object FirestoreCollections {
    const val USERS = "users"
    const val SCANS = "scans"
    const val PRODUCTS = "products"

    fun userDoc(uid: String) = "$USERS/$uid"
    fun userScans(uid: String) = "$USERS/$uid/$SCANS"
    fun scanDoc(uid: String, scanId: String) = "$USERS/$uid/$SCANS/$scanId"
}
