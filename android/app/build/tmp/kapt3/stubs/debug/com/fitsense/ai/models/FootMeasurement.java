package com.fitsense.ai.models;

import kotlinx.serialization.Serializable;

/**
 * Geometric measurement of a single foot derived from a scan.
 *
 * Length & width are always stored in millimetres internally; the UI converts
 * to imperial via [com.fitsense.ai.measurement.UnitConverter] when displaying.
 */
@kotlinx.serialization.Serializable()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000X\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0003\n\u0002\u0010\u0007\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0014\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 <2\u00020\u0001:\u0002;<BW\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u0012\u0006\u0010\b\u001a\u00020\t\u0012\b\u0010\n\u001a\u0004\u0018\u00010\u000b\u0012\b\u0010\f\u001a\u0004\u0018\u00010\r\u0012\u0006\u0010\u000e\u001a\u00020\u0005\u0012\b\u0010\u000f\u001a\u0004\u0018\u00010\u0010\u00a2\u0006\u0002\u0010\u0011BI\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u0012\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u0012\b\b\u0002\u0010\b\u001a\u00020\t\u0012\b\b\u0002\u0010\n\u001a\u00020\u000b\u0012\b\b\u0002\u0010\f\u001a\u00020\r\u0012\b\b\u0002\u0010\u000e\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0012J\t\u0010%\u001a\u00020\u0005H\u00c6\u0003J\t\u0010&\u001a\u00020\u0005H\u00c6\u0003J\u0010\u0010\'\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003\u00a2\u0006\u0002\u0010\u0014J\t\u0010(\u001a\u00020\tH\u00c6\u0003J\t\u0010)\u001a\u00020\u000bH\u00c6\u0003J\t\u0010*\u001a\u00020\rH\u00c6\u0003J\t\u0010+\u001a\u00020\u0005H\u00c6\u0003JV\u0010,\u001a\u00020\u00002\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00052\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00052\b\b\u0002\u0010\b\u001a\u00020\t2\b\b\u0002\u0010\n\u001a\u00020\u000b2\b\b\u0002\u0010\f\u001a\u00020\r2\b\b\u0002\u0010\u000e\u001a\u00020\u0005H\u00c6\u0001\u00a2\u0006\u0002\u0010-J\u0013\u0010.\u001a\u00020\u001d2\b\u0010/\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u00100\u001a\u00020\u0003H\u00d6\u0001J\t\u00101\u001a\u000202H\u00d6\u0001J&\u00103\u001a\u0002042\u0006\u00105\u001a\u00020\u00002\u0006\u00106\u001a\u0002072\u0006\u00108\u001a\u000209H\u00c1\u0001\u00a2\u0006\u0002\b:R\u0015\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\n\n\u0002\u0010\u0015\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0011\u0010\u001c\u001a\u00020\u001d8F\u00a2\u0006\u0006\u001a\u0004\b\u001c\u0010\u001eR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010 R\u0011\u0010\u000e\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010 R\u0011\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\"\u0010 R\u0011\u0010#\u001a\u00020\u00058F\u00a2\u0006\u0006\u001a\u0004\b$\u0010 \u00a8\u0006="}, d2 = {"Lcom/fitsense/ai/models/FootMeasurement;", "", "seen1", "", "lengthMm", "", "widthMm", "archHeightMm", "confidence", "", "foot", "Lcom/fitsense/ai/models/Foot;", "calibration", "Lcom/fitsense/ai/models/CalibrationReference;", "pixelsPerMm", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(IDDLjava/lang/Double;FLcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;DLkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(DDLjava/lang/Double;FLcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;D)V", "getArchHeightMm", "()Ljava/lang/Double;", "Ljava/lang/Double;", "getCalibration", "()Lcom/fitsense/ai/models/CalibrationReference;", "getConfidence", "()F", "getFoot", "()Lcom/fitsense/ai/models/Foot;", "isWide", "", "()Z", "getLengthMm", "()D", "getPixelsPerMm", "getWidthMm", "widthToLengthRatio", "getWidthToLengthRatio", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "copy", "(DDLjava/lang/Double;FLcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;D)Lcom/fitsense/ai/models/FootMeasurement;", "equals", "other", "hashCode", "toString", "", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
public final class FootMeasurement {
    private final double lengthMm = 0.0;
    private final double widthMm = 0.0;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Double archHeightMm = null;
    private final float confidence = 0.0F;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.models.Foot foot = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.models.CalibrationReference calibration = null;
    private final double pixelsPerMm = 0.0;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.models.FootMeasurement.Companion Companion = null;
    
    public FootMeasurement(double lengthMm, double widthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double archHeightMm, float confidence, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.Foot foot, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference calibration, double pixelsPerMm) {
        super();
    }
    
    public final double getLengthMm() {
        return 0.0;
    }
    
    public final double getWidthMm() {
        return 0.0;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double getArchHeightMm() {
        return null;
    }
    
    public final float getConfidence() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.Foot getFoot() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.CalibrationReference getCalibration() {
        return null;
    }
    
    public final double getPixelsPerMm() {
        return 0.0;
    }
    
    public final double getWidthToLengthRatio() {
        return 0.0;
    }
    
    public final boolean isWide() {
        return false;
    }
    
    public final double component1() {
        return 0.0;
    }
    
    public final double component2() {
        return 0.0;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double component3() {
        return null;
    }
    
    public final float component4() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.Foot component5() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.CalibrationReference component6() {
        return null;
    }
    
    public final double component7() {
        return 0.0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.FootMeasurement copy(double lengthMm, double widthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double archHeightMm, float confidence, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.Foot foot, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference calibration, double pixelsPerMm) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
    
    @kotlin.jvm.JvmStatic()
    public static final void write$Self$app_debug(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.FootMeasurement self, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
    }
    
    /**
     * Geometric measurement of a single foot derived from a scan.
     *
     * Length & width are always stored in millimetres internally; the UI converts
     * to imperial via [com.fitsense.ai.measurement.UnitConverter] when displaying.
     */
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/fitsense/ai/models/FootMeasurement.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/fitsense/ai/models/FootMeasurement;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
    @java.lang.Deprecated()
    public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.fitsense.ai.models.FootMeasurement> {
        @org.jetbrains.annotations.NotNull()
        public static final com.fitsense.ai.models.FootMeasurement.$serializer INSTANCE = null;
        
        private $serializer() {
            super();
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.KSerializer<?>[] childSerializers() {
            return null;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public com.fitsense.ai.models.FootMeasurement deserialize(@org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.Decoder decoder) {
            return null;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.descriptors.SerialDescriptor getDescriptor() {
            return null;
        }
        
        @java.lang.Override()
        public void serialize(@org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.Encoder encoder, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.FootMeasurement value) {
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
            return null;
        }
    }
    
    /**
     * Geometric measurement of a single foot derived from a scan.
     *
     * Length & width are always stored in millimetres internally; the UI converts
     * to imperial via [com.fitsense.ai.measurement.UnitConverter] when displaying.
     */
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/models/FootMeasurement$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/models/FootMeasurement;", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final kotlinx.serialization.KSerializer<com.fitsense.ai.models.FootMeasurement> serializer() {
            return null;
        }
    }
}