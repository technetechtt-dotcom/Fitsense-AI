package com.fitsense.ai.sync;

import com.fitsense.ai.api.ApiConfig;
import com.fitsense.ai.auth.DeviceAuthClient;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.ScanResult;
import kotlinx.coroutines.Dispatchers;
import kotlinx.serialization.Serializable;
import kotlinx.serialization.json.JsonElement;
import kotlinx.serialization.json.JsonObject;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Cloud sync client for `/v1/sync` endpoints. Requires prior consent in the UI layer;
 * this class only performs HTTP when [ApiConfig] is configured and auth works.
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u000f\b\u0007\u0018\u00002\u00020\u0001:\u0001.B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0016\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000bJ5\u0010\f\u001a\u00020\n2\u0006\u0010\r\u001a\u00020\n2\b\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u000f2\f\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\n0\u0012\u00a2\u0006\u0002\u0010\u0013J\u000e\u0010\u0014\u001a\u00020\n2\u0006\u0010\u0015\u001a\u00020\u0016J\u000e\u0010\u0017\u001a\u00020\bH\u0086@\u00a2\u0006\u0002\u0010\u0018J\u0010\u0010\u0019\u001a\u0004\u0018\u00010\nH\u0086@\u00a2\u0006\u0002\u0010\u0018J \u0010\u001a\u001a\u00020\u001b2\u0006\u0010\u001c\u001a\u00020\n2\u0006\u0010\u001d\u001a\u00020\n2\u0006\u0010\u001e\u001a\u00020\nH\u0002J\u0010\u0010\u001f\u001a\u0004\u0018\u00010 H\u0086@\u00a2\u0006\u0002\u0010\u0018J\u0016\u0010!\u001a\u00020\b2\u0006\u0010\"\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000bJ\u0016\u0010#\u001a\u00020\b2\u0006\u0010\u0015\u001a\u00020\u0016H\u0086@\u00a2\u0006\u0002\u0010$J\u001e\u0010%\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\"\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010&J\u0010\u0010\'\u001a\u00020\n2\u0006\u0010(\u001a\u00020\u001bH\u0002J\u0010\u0010)\u001a\u00020\n2\u0006\u0010\u0015\u001a\u00020\u0016H\u0002J!\u0010*\u001a\u00020\n2\b\u0010+\u001a\u0004\u0018\u00010\u000f2\b\u0010,\u001a\u0004\u0018\u00010\u000fH\u0002\u00a2\u0006\u0002\u0010-R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006/"}, d2 = {"Lcom/fitsense/ai/sync/SyncClient;", "", "authClient", "Lcom/fitsense/ai/auth/DeviceAuthClient;", "(Lcom/fitsense/ai/auth/DeviceAuthClient;)V", "json", "Lkotlinx/serialization/json/Json;", "deleteScan", "", "scanId", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "encodeFitProfile", "userId", "cachedLengthMm", "", "cachedWidthMm", "favouriteBrands", "", "(Ljava/lang/String;Ljava/lang/Double;Ljava/lang/Double;Ljava/util/List;)Ljava/lang/String;", "encodeScan", "scan", "Lcom/fitsense/ai/models/ScanResult;", "eraseAll", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "exportJson", "open", "Ljava/net/HttpURLConnection;", "url", "method", "bearer", "pull", "Lcom/fitsense/ai/sync/SyncClient$CloudPull;", "pushFitProfileJson", "payloadJson", "pushScan", "(Lcom/fitsense/ai/models/ScanResult;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "pushScanJson", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "readBody", "conn", "scanToJson", "widthClassFor", "lengthMm", "widthMm", "(Ljava/lang/Double;Ljava/lang/Double;)Ljava/lang/String;", "CloudPull", "app_debug"})
public final class SyncClient {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.auth.DeviceAuthClient authClient = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.serialization.json.Json json = null;
    
    @javax.inject.Inject()
    public SyncClient(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.auth.DeviceAuthClient authClient) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object pull(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.sync.SyncClient.CloudPull> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object pushScan(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.ScanResult scan, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object pushScanJson(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    java.lang.String payloadJson, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object pushFitProfileJson(@org.jetbrains.annotations.NotNull()
    java.lang.String payloadJson, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String encodeScan(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.ScanResult scan) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String encodeFitProfile(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.Nullable()
    java.lang.Double cachedLengthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double cachedWidthMm, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> favouriteBrands) {
        return null;
    }
    
    private final java.lang.String widthClassFor(java.lang.Double lengthMm, java.lang.Double widthMm) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object deleteScan(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object eraseAll(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object exportJson(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    private final java.lang.String scanToJson(com.fitsense.ai.models.ScanResult scan) {
        return null;
    }
    
    private final java.net.HttpURLConnection open(java.lang.String url, java.lang.String method, java.lang.String bearer) {
        return null;
    }
    
    private final java.lang.String readBody(java.net.HttpURLConnection conn) {
        return null;
    }
    
    @kotlinx.serialization.Serializable()
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000J\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 %2\u00020\u0001:\u0002$%BC\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\u000e\u0010\u0006\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\u0007\u0012\u000e\u0010\b\u001a\n\u0012\u0004\u0012\u00020\u0005\u0018\u00010\u0007\u0012\b\u0010\t\u001a\u0004\u0018\u00010\n\u00a2\u0006\u0002\u0010\u000bB1\u0012\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\u000e\b\u0002\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007\u0012\u000e\b\u0002\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007\u00a2\u0006\u0002\u0010\fJ\u000b\u0010\u0012\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\u000f\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007H\u00c6\u0003J\u000f\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007H\u00c6\u0003J5\u0010\u0015\u001a\u00020\u00002\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00052\u000e\b\u0002\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00050\u00072\u000e\b\u0002\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007H\u00c6\u0001J\u0013\u0010\u0016\u001a\u00020\u00172\b\u0010\u0018\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0019\u001a\u00020\u0003H\u00d6\u0001J\t\u0010\u001a\u001a\u00020\u001bH\u00d6\u0001J&\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u00002\u0006\u0010\u001f\u001a\u00020 2\u0006\u0010!\u001a\u00020\"H\u00c1\u0001\u00a2\u0006\u0002\b#R\u0017\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0013\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0017\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u000e\u00a8\u0006&"}, d2 = {"Lcom/fitsense/ai/sync/SyncClient$CloudPull;", "", "seen1", "", "fitProfile", "Lkotlinx/serialization/json/JsonElement;", "fitEvents", "", "scans", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(ILkotlinx/serialization/json/JsonElement;Ljava/util/List;Ljava/util/List;Lkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(Lkotlinx/serialization/json/JsonElement;Ljava/util/List;Ljava/util/List;)V", "getFitEvents", "()Ljava/util/List;", "getFitProfile", "()Lkotlinx/serialization/json/JsonElement;", "getScans", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "toString", "", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
    public static final class CloudPull {
        @org.jetbrains.annotations.Nullable()
        private final kotlinx.serialization.json.JsonElement fitProfile = null;
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<kotlinx.serialization.json.JsonElement> fitEvents = null;
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<kotlinx.serialization.json.JsonElement> scans = null;
        @org.jetbrains.annotations.NotNull()
        public static final com.fitsense.ai.sync.SyncClient.CloudPull.Companion Companion = null;
        
        public CloudPull(@org.jetbrains.annotations.Nullable()
        kotlinx.serialization.json.JsonElement fitProfile, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends kotlinx.serialization.json.JsonElement> fitEvents, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends kotlinx.serialization.json.JsonElement> scans) {
            super();
        }
        
        @org.jetbrains.annotations.Nullable()
        public final kotlinx.serialization.json.JsonElement getFitProfile() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<kotlinx.serialization.json.JsonElement> getFitEvents() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<kotlinx.serialization.json.JsonElement> getScans() {
            return null;
        }
        
        public CloudPull() {
            super();
        }
        
        @org.jetbrains.annotations.Nullable()
        public final kotlinx.serialization.json.JsonElement component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<kotlinx.serialization.json.JsonElement> component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<kotlinx.serialization.json.JsonElement> component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.sync.SyncClient.CloudPull copy(@org.jetbrains.annotations.Nullable()
        kotlinx.serialization.json.JsonElement fitProfile, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends kotlinx.serialization.json.JsonElement> fitEvents, @org.jetbrains.annotations.NotNull()
        java.util.List<? extends kotlinx.serialization.json.JsonElement> scans) {
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
        com.fitsense.ai.sync.SyncClient.CloudPull self, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/fitsense/ai/sync/SyncClient.CloudPull.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/fitsense/ai/sync/SyncClient$CloudPull;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
        @java.lang.Deprecated()
        public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.fitsense.ai.sync.SyncClient.CloudPull> {
            @org.jetbrains.annotations.NotNull()
            public static final com.fitsense.ai.sync.SyncClient.CloudPull.$serializer INSTANCE = null;
            
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
            public com.fitsense.ai.sync.SyncClient.CloudPull deserialize(@org.jetbrains.annotations.NotNull()
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
            com.fitsense.ai.sync.SyncClient.CloudPull value) {
            }
            
            @java.lang.Override()
            @org.jetbrains.annotations.NotNull()
            public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
                return null;
            }
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/sync/SyncClient$CloudPull$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/sync/SyncClient$CloudPull;", "app_debug"})
        public static final class Companion {
            
            private Companion() {
                super();
            }
            
            @org.jetbrains.annotations.NotNull()
            public final kotlinx.serialization.KSerializer<com.fitsense.ai.sync.SyncClient.CloudPull> serializer() {
                return null;
            }
        }
    }
}