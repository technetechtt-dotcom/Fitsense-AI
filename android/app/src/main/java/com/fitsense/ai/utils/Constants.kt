package com.fitsense.ai.utils

/** App-wide constants that don't belong to any single feature. */
object Constants {

    // ---- Firestore collection / field names --------------------------------
    const val USERS_COLLECTION = "users"
    const val SCANS_COLLECTION = "scans"
    const val PRODUCTS_COLLECTION = "products"

    // ---- Storage paths ------------------------------------------------------
    // Scan thumbnails are not persisted; cloud sync uses measurement payloads only.

    // ---- Sizing -------------------------------------------------------------
    /** Heel-space comfort margin appended to raw foot length when mapping → size. */
    const val SIZE_HEEL_MARGIN_MM = 8.0

    /** Confidence floor below which a measurement is marked low-quality in the UI. */
    const val LOW_CONFIDENCE_THRESHOLD = 0.55f

    // ---- ARCore -------------------------------------------------------------
    const val MIN_PLANE_AREA_M2 = 0.06f // ~ A4 sized plane
    const val PLANE_DETECTION_TIMEOUT_MS = 15_000L

    // ---- OpenCV -------------------------------------------------------------
    const val CANNY_LOW_THRESHOLD = 60.0
    const val CANNY_HIGH_THRESHOLD = 160.0
    const val MIN_FOOT_CONTOUR_AREA = 8_000.0   // pixels^2
}
