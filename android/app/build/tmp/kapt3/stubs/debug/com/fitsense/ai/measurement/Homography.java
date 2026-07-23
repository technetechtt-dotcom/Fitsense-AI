package com.fitsense.ai.measurement;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000*\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0011\n\u0002\u0010\u0013\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\b\u0007\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J%\u0010\u0003\u001a\u00020\u00042\u0010\u0010\u0005\u001a\f\u0012\u0004\u0012\u00020\u00070\u0006j\u0002`\b2\u0006\u0010\t\u001a\u00020\u0004\u00a2\u0006\u0002\u0010\nJ1\u0010\u000b\u001a\f\u0012\u0004\u0012\u00020\u00070\u0006j\u0002`\b2\f\u0010\f\u001a\b\u0012\u0004\u0012\u00020\u00040\r2\f\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00040\r\u00a2\u0006\u0002\u0010\u000fJ#\u0010\u0010\u001a\u00020\u00072\f\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\u0012\u001a\u00020\u0007H\u0002\u00a2\u0006\u0002\u0010\u0013\u00a8\u0006\u0014"}, d2 = {"Lcom/fitsense/ai/measurement/Homography;", "", "()V", "apply", "Lcom/fitsense/ai/measurement/Point2D;", "H", "", "", "Lcom/fitsense/ai/measurement/Mat3;", "p", "([[DLcom/fitsense/ai/measurement/Point2D;)Lcom/fitsense/ai/measurement/Point2D;", "compute", "src", "", "dst", "(Ljava/util/List;Ljava/util/List;)[[D", "solveLinearSystem", "a", "b", "([[D[D)[D", "app_debug"})
public final class Homography {
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.measurement.Homography INSTANCE = null;
    
    private Homography() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final double[][] compute(@org.jetbrains.annotations.NotNull()
    java.util.List<com.fitsense.ai.measurement.Point2D> src, @org.jetbrains.annotations.NotNull()
    java.util.List<com.fitsense.ai.measurement.Point2D> dst) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.Point2D apply(@org.jetbrains.annotations.NotNull()
    double[][] H, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.Point2D p) {
        return null;
    }
    
    private final double[] solveLinearSystem(double[][] a, double[] b) {
        return null;
    }
}