package com.fitsense.ai.models;

import kotlinx.serialization.Serializable;

/**
 * User-tunable defaults.
 */
@kotlinx.serialization.Serializable()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000T\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b \n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 <2\u00020\u0001:\u0002;<Bk\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u0012\u0006\u0010\n\u001a\u00020\t\u0012\u000e\u0010\u000b\u001a\n\u0012\u0004\u0012\u00020\r\u0018\u00010\f\u0012\b\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u0012\b\u0010\u0010\u001a\u0004\u0018\u00010\u000f\u0012\b\u0010\u0011\u001a\u0004\u0018\u00010\r\u0012\b\u0010\u0012\u001a\u0004\u0018\u00010\u0013\u00a2\u0006\u0002\u0010\u0014Ba\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0005\u0012\b\b\u0002\u0010\u0006\u001a\u00020\u0007\u0012\b\b\u0002\u0010\b\u001a\u00020\t\u0012\b\b\u0002\u0010\n\u001a\u00020\t\u0012\u000e\b\u0002\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\r0\f\u0012\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\r\u00a2\u0006\u0002\u0010\u0015J\t\u0010%\u001a\u00020\u0005H\u00c6\u0003J\t\u0010&\u001a\u00020\u0007H\u00c6\u0003J\t\u0010\'\u001a\u00020\tH\u00c6\u0003J\t\u0010(\u001a\u00020\tH\u00c6\u0003J\u000f\u0010)\u001a\b\u0012\u0004\u0012\u00020\r0\fH\u00c6\u0003J\u0010\u0010*\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003\u00a2\u0006\u0002\u0010\u001eJ\u0010\u0010+\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003\u00a2\u0006\u0002\u0010\u001eJ\u000b\u0010,\u001a\u0004\u0018\u00010\rH\u00c6\u0003Jj\u0010-\u001a\u00020\u00002\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\t2\b\b\u0002\u0010\n\u001a\u00020\t2\u000e\b\u0002\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\r0\f2\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\rH\u00c6\u0001\u00a2\u0006\u0002\u0010.J\u0013\u0010/\u001a\u00020\t2\b\u00100\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u00101\u001a\u00020\u0003H\u00d6\u0001J\t\u00102\u001a\u00020\rH\u00d6\u0001J&\u00103\u001a\u0002042\u0006\u00105\u001a\u00020\u00002\u0006\u00106\u001a\u0002072\u0006\u00108\u001a\u000209H\u00c1\u0001\u00a2\u0006\u0002\b:R\u0013\u0010\u0011\u001a\u0004\u0018\u00010\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\n\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u0019R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u001cR\u0015\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\n\n\u0002\u0010\u001f\u001a\u0004\b\u001d\u0010\u001eR\u0015\u0010\u0010\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\n\n\u0002\u0010\u001f\u001a\u0004\b \u0010\u001eR\u0017\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\r0\f\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010\"R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b#\u0010$\u00a8\u0006="}, d2 = {"Lcom/fitsense/ai/models/UserPreferences;", "", "seen1", "", "units", "Lcom/fitsense/ai/models/MeasurementUnit;", "defaultCalibration", "Lcom/fitsense/ai/models/CalibrationReference;", "analyticsOptIn", "", "cloudSyncOptIn", "preferredBrands", "", "", "groundTruthLengthMm", "", "groundTruthWidthMm", "accuracyStudyNotes", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(ILcom/fitsense/ai/models/MeasurementUnit;Lcom/fitsense/ai/models/CalibrationReference;ZZLjava/util/List;Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/String;Lkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(Lcom/fitsense/ai/models/MeasurementUnit;Lcom/fitsense/ai/models/CalibrationReference;ZZLjava/util/List;Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/String;)V", "getAccuracyStudyNotes", "()Ljava/lang/String;", "getAnalyticsOptIn", "()Z", "getCloudSyncOptIn", "getDefaultCalibration", "()Lcom/fitsense/ai/models/CalibrationReference;", "getGroundTruthLengthMm", "()Ljava/lang/Double;", "Ljava/lang/Double;", "getGroundTruthWidthMm", "getPreferredBrands", "()Ljava/util/List;", "getUnits", "()Lcom/fitsense/ai/models/MeasurementUnit;", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "copy", "(Lcom/fitsense/ai/models/MeasurementUnit;Lcom/fitsense/ai/models/CalibrationReference;ZZLjava/util/List;Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/String;)Lcom/fitsense/ai/models/UserPreferences;", "equals", "other", "hashCode", "toString", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
public final class UserPreferences {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.models.MeasurementUnit units = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.models.CalibrationReference defaultCalibration = null;
    private final boolean analyticsOptIn = false;
    
    /**
     * When true and API_BASE_URL is set, scans sync to FitSense cloud.
     */
    private final boolean cloudSyncOptIn = false;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<java.lang.String> preferredBrands = null;
    
    /**
     * Optional Brannock / known-foot ground truth for accuracy study captures.
     */
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Double groundTruthLengthMm = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.Double groundTruthWidthMm = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String accuracyStudyNotes = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.models.UserPreferences.Companion Companion = null;
    
    public UserPreferences(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.MeasurementUnit units, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference defaultCalibration, boolean analyticsOptIn, boolean cloudSyncOptIn, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> preferredBrands, @org.jetbrains.annotations.Nullable()
    java.lang.Double groundTruthLengthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double groundTruthWidthMm, @org.jetbrains.annotations.Nullable()
    java.lang.String accuracyStudyNotes) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.MeasurementUnit getUnits() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.CalibrationReference getDefaultCalibration() {
        return null;
    }
    
    public final boolean getAnalyticsOptIn() {
        return false;
    }
    
    /**
     * When true and API_BASE_URL is set, scans sync to FitSense cloud.
     */
    public final boolean getCloudSyncOptIn() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> getPreferredBrands() {
        return null;
    }
    
    /**
     * Optional Brannock / known-foot ground truth for accuracy study captures.
     */
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double getGroundTruthLengthMm() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double getGroundTruthWidthMm() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getAccuracyStudyNotes() {
        return null;
    }
    
    public UserPreferences() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.MeasurementUnit component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.CalibrationReference component2() {
        return null;
    }
    
    public final boolean component3() {
        return false;
    }
    
    public final boolean component4() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> component5() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double component6() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Double component7() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component8() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.models.UserPreferences copy(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.MeasurementUnit units, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference defaultCalibration, boolean analyticsOptIn, boolean cloudSyncOptIn, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> preferredBrands, @org.jetbrains.annotations.Nullable()
    java.lang.Double groundTruthLengthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double groundTruthWidthMm, @org.jetbrains.annotations.Nullable()
    java.lang.String accuracyStudyNotes) {
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
    com.fitsense.ai.models.UserPreferences self, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
    }
    
    /**
     * User-tunable defaults.
     */
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/fitsense/ai/models/UserPreferences.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/fitsense/ai/models/UserPreferences;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
    @java.lang.Deprecated()
    public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.fitsense.ai.models.UserPreferences> {
        @org.jetbrains.annotations.NotNull()
        public static final com.fitsense.ai.models.UserPreferences.$serializer INSTANCE = null;
        
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
        public com.fitsense.ai.models.UserPreferences deserialize(@org.jetbrains.annotations.NotNull()
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
        com.fitsense.ai.models.UserPreferences value) {
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
            return null;
        }
    }
    
    /**
     * User-tunable defaults.
     */
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/models/UserPreferences$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/models/UserPreferences;", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final kotlinx.serialization.KSerializer<com.fitsense.ai.models.UserPreferences> serializer() {
            return null;
        }
    }
}