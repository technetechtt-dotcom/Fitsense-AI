package com.fitsense.ai.utils;

/**
 * App-wide constants that don't belong to any single feature.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000*\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0003\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0007X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\rX\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\rX\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\rX\u0086T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0011"}, d2 = {"Lcom/fitsense/ai/utils/Constants;", "", "()V", "CANNY_HIGH_THRESHOLD", "", "CANNY_LOW_THRESHOLD", "LOW_CONFIDENCE_THRESHOLD", "", "MIN_FOOT_CONTOUR_AREA", "MIN_PLANE_AREA_M2", "PLANE_DETECTION_TIMEOUT_MS", "", "PRODUCTS_COLLECTION", "", "SCANS_COLLECTION", "SIZE_HEEL_MARGIN_MM", "USERS_COLLECTION", "app_debug"})
public final class Constants {
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String USERS_COLLECTION = "users";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String SCANS_COLLECTION = "scans";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String PRODUCTS_COLLECTION = "products";
    
    /**
     * Heel-space comfort margin appended to raw foot length when mapping → size.
     */
    public static final double SIZE_HEEL_MARGIN_MM = 8.0;
    
    /**
     * Confidence floor below which a measurement is marked low-quality in the UI.
     */
    public static final float LOW_CONFIDENCE_THRESHOLD = 0.55F;
    public static final float MIN_PLANE_AREA_M2 = 0.06F;
    public static final long PLANE_DETECTION_TIMEOUT_MS = 15000L;
    public static final double CANNY_LOW_THRESHOLD = 60.0;
    public static final double CANNY_HIGH_THRESHOLD = 160.0;
    public static final double MIN_FOOT_CONTOUR_AREA = 8000.0;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.utils.Constants INSTANCE = null;
    
    private Constants() {
        super();
    }
}