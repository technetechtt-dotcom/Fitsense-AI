package com.fitsense.ai.accuracy;

import android.content.Context;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.Foot;
import dagger.hilt.android.qualifiers.ApplicationContext;
import kotlinx.coroutines.Dispatchers;
import kotlinx.serialization.Serializable;
import java.io.File;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Append-only store for controlled validation captures.
 * Used to build the first accuracy dataset during pilot testing.
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001:\u0001\u0013B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0016\u0010\u000b\u001a\u00020\f2\u0006\u0010\r\u001a\u00020\u000eH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0014\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u000e0\u0011H\u0086@\u00a2\u0006\u0002\u0010\u0012R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068BX\u0082\u0004\u00a2\u0006\u0006\u001a\u0004\b\u0007\u0010\bR\u000e\u0010\t\u001a\u00020\nX\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0014"}, d2 = {"Lcom/fitsense/ai/accuracy/AccuracyDatasetStore;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "file", "Ljava/io/File;", "getFile", "()Ljava/io/File;", "json", "Lkotlinx/serialization/json/Json;", "append", "", "record", "Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;", "(Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "readAll", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "AccuracyRecord", "app_debug"})
public final class AccuracyDatasetStore {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.serialization.json.Json json = null;
    
    @javax.inject.Inject()
    public AccuracyDatasetStore(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    private final java.io.File getFile() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object append(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord record, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object readAll(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord>> $completion) {
        return null;
    }
    
    @kotlinx.serialization.Serializable()
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000^\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b!\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 D2\u00020\u0001:\u0002CDBu\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\b\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u0012\b\u0010\b\u001a\u0004\u0018\u00010\t\u0012\b\u0010\n\u001a\u0004\u0018\u00010\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u0012\u0006\u0010\u000e\u001a\u00020\r\u0012\u0006\u0010\u000f\u001a\u00020\u0010\u0012\b\u0010\u0011\u001a\u0004\u0018\u00010\r\u0012\b\u0010\u0012\u001a\u0004\u0018\u00010\r\u0012\b\u0010\u0013\u001a\u0004\u0018\u00010\u0007\u0012\b\u0010\u0014\u001a\u0004\u0018\u00010\u0015\u00a2\u0006\u0002\u0010\u0016Ba\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u0012\u0006\u0010\n\u001a\u00020\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u0012\u0006\u0010\u000e\u001a\u00020\r\u0012\u0006\u0010\u000f\u001a\u00020\u0010\u0012\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\r\u0012\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\r\u0012\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\u0002\u0010\u0017J\t\u0010*\u001a\u00020\u0005H\u00c6\u0003J\u000b\u0010+\u001a\u0004\u0018\u00010\u0007H\u00c6\u0003J\t\u0010,\u001a\u00020\u0007H\u00c6\u0003J\t\u0010-\u001a\u00020\tH\u00c6\u0003J\t\u0010.\u001a\u00020\u000bH\u00c6\u0003J\t\u0010/\u001a\u00020\rH\u00c6\u0003J\t\u00100\u001a\u00020\rH\u00c6\u0003J\t\u00101\u001a\u00020\u0010H\u00c6\u0003J\u0010\u00102\u001a\u0004\u0018\u00010\rH\u00c6\u0003\u00a2\u0006\u0002\u0010!J\u0010\u00103\u001a\u0004\u0018\u00010\rH\u00c6\u0003\u00a2\u0006\u0002\u0010!Jx\u00104\u001a\u00020\u00002\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\t2\b\b\u0002\u0010\n\u001a\u00020\u000b2\b\b\u0002\u0010\f\u001a\u00020\r2\b\b\u0002\u0010\u000e\u001a\u00020\r2\b\b\u0002\u0010\u000f\u001a\u00020\u00102\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\r2\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\r2\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0007H\u00c6\u0001\u00a2\u0006\u0002\u00105J\u0013\u00106\u001a\u0002072\b\u00108\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u00109\u001a\u00020\u0003H\u00d6\u0001J\t\u0010:\u001a\u00020\u0007H\u00d6\u0001J&\u0010;\u001a\u00020<2\u0006\u0010=\u001a\u00020\u00002\u0006\u0010>\u001a\u00020?2\u0006\u0010@\u001a\u00020AH\u00c1\u0001\u00a2\u0006\u0002\bBR\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\u000f\u001a\u00020\u0010\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001fR\u0015\u0010\u0011\u001a\u0004\u0018\u00010\r\u00a2\u0006\n\n\u0002\u0010\"\u001a\u0004\b \u0010!R\u0015\u0010\u0012\u001a\u0004\u0018\u00010\r\u00a2\u0006\n\n\u0002\u0010\"\u001a\u0004\b#\u0010!R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b$\u0010%R\u0011\u0010\u000e\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b&\u0010%R\u0013\u0010\u0013\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\'\u0010\u001dR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b(\u0010)\u00a8\u0006E"}, d2 = {"Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;", "", "seen1", "", "recordedAtEpochMs", "", "deviceModel", "", "foot", "Lcom/fitsense/ai/models/Foot;", "calibration", "Lcom/fitsense/ai/models/CalibrationReference;", "measuredLengthMm", "", "measuredWidthMm", "confidence", "", "groundTruthLengthMm", "groundTruthWidthMm", "notes", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(IJLjava/lang/String;Lcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;DDFLjava/lang/Double;Ljava/lang/Double;Ljava/lang/String;Lkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(JLjava/lang/String;Lcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;DDFLjava/lang/Double;Ljava/lang/Double;Ljava/lang/String;)V", "getCalibration", "()Lcom/fitsense/ai/models/CalibrationReference;", "getConfidence", "()F", "getDeviceModel", "()Ljava/lang/String;", "getFoot", "()Lcom/fitsense/ai/models/Foot;", "getGroundTruthLengthMm", "()Ljava/lang/Double;", "Ljava/lang/Double;", "getGroundTruthWidthMm", "getMeasuredLengthMm", "()D", "getMeasuredWidthMm", "getNotes", "getRecordedAtEpochMs", "()J", "component1", "component10", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "(JLjava/lang/String;Lcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/models/CalibrationReference;DDFLjava/lang/Double;Ljava/lang/Double;Ljava/lang/String;)Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;", "equals", "", "other", "hashCode", "toString", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
    public static final class AccuracyRecord {
        private final long recordedAtEpochMs = 0L;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String deviceModel = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.Foot foot = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.CalibrationReference calibration = null;
        private final double measuredLengthMm = 0.0;
        private final double measuredWidthMm = 0.0;
        private final float confidence = 0.0F;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Double groundTruthLengthMm = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Double groundTruthWidthMm = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String notes = null;
        @org.jetbrains.annotations.NotNull()
        public static final com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord.Companion Companion = null;
        
        public AccuracyRecord(long recordedAtEpochMs, @org.jetbrains.annotations.NotNull()
        java.lang.String deviceModel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference calibration, double measuredLengthMm, double measuredWidthMm, float confidence, @org.jetbrains.annotations.Nullable()
        java.lang.Double groundTruthLengthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Double groundTruthWidthMm, @org.jetbrains.annotations.Nullable()
        java.lang.String notes) {
            super();
        }
        
        public final long getRecordedAtEpochMs() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getDeviceModel() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot getFoot() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference getCalibration() {
            return null;
        }
        
        public final double getMeasuredLengthMm() {
            return 0.0;
        }
        
        public final double getMeasuredWidthMm() {
            return 0.0;
        }
        
        public final float getConfidence() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double getGroundTruthLengthMm() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double getGroundTruthWidthMm() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getNotes() {
            return null;
        }
        
        public final long component1() {
            return 0L;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component10() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference component4() {
            return null;
        }
        
        public final double component5() {
            return 0.0;
        }
        
        public final double component6() {
            return 0.0;
        }
        
        public final float component7() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double component8() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double component9() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord copy(long recordedAtEpochMs, @org.jetbrains.annotations.NotNull()
        java.lang.String deviceModel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot foot, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference calibration, double measuredLengthMm, double measuredWidthMm, float confidence, @org.jetbrains.annotations.Nullable()
        java.lang.Double groundTruthLengthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Double groundTruthWidthMm, @org.jetbrains.annotations.Nullable()
        java.lang.String notes) {
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
        com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord self, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/fitsense/ai/accuracy/AccuracyDatasetStore.AccuracyRecord.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
        @java.lang.Deprecated()
        public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord> {
            @org.jetbrains.annotations.NotNull()
            public static final com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord.$serializer INSTANCE = null;
            
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
            public com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord deserialize(@org.jetbrains.annotations.NotNull()
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
            com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord value) {
            }
            
            @java.lang.Override()
            @org.jetbrains.annotations.NotNull()
            public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
                return null;
            }
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/accuracy/AccuracyDatasetStore$AccuracyRecord;", "app_debug"})
        public static final class Companion {
            
            private Companion() {
                super();
            }
            
            @org.jetbrains.annotations.NotNull()
            public final kotlinx.serialization.KSerializer<com.fitsense.ai.accuracy.AccuracyDatasetStore.AccuracyRecord> serializer() {
                return null;
            }
        }
    }
}