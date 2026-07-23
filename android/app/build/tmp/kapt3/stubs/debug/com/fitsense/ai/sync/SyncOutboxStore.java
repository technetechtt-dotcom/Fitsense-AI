package com.fitsense.ai.sync;

import android.content.Context;
import android.content.SharedPreferences;
import dagger.hilt.android.qualifiers.ApplicationContext;
import kotlinx.serialization.Serializable;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Durable offline outbox for cloud sync ops. Prevents silent data loss when
 * push fails or the device is offline; flushed with exponential backoff.
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0005\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\r\b\u0007\u0018\u0000 %2\u00020\u0001:\u0004%&\'(B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0006\u0010\t\u001a\u00020\nJ\u0016\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\r0\f2\b\b\u0002\u0010\u000e\u001a\u00020\u000fJ\u000e\u0010\u0010\u001a\u00020\n2\u0006\u0010\u0011\u001a\u00020\u0012J\u0016\u0010\u0013\u001a\u00020\n2\u0006\u0010\u0014\u001a\u00020\u00122\u0006\u0010\u0015\u001a\u00020\u0012J\u0016\u0010\u0016\u001a\u00020\n2\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0015\u001a\u00020\u0012J\u0006\u0010\u0017\u001a\u00020\u0018J\"\u0010\u0019\u001a\u00020\n2\u0006\u0010\u001a\u001a\u00020\u00122\u0006\u0010\u001b\u001a\u00020\u001c2\n\b\u0002\u0010\u001d\u001a\u0004\u0018\u00010\u0012J\u0006\u0010\u001e\u001a\u00020\u0018J\u000e\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020\r0\fH\u0002J\f\u0010 \u001a\b\u0012\u0004\u0012\u00020\r0\fJ\u0010\u0010!\u001a\u00020\n2\u0006\u0010\"\u001a\u00020\rH\u0002J\u0016\u0010#\u001a\u00020\n2\f\u0010$\u001a\b\u0012\u0004\u0012\u00020\r0\fH\u0002R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006)"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "json", "Lkotlinx/serialization/json/Json;", "prefs", "Landroid/content/SharedPreferences;", "clear", "", "dueItems", "", "Lcom/fitsense/ai/sync/SyncOutboxStore$OutboxItem;", "nowEpochMs", "", "enqueueDeleteScan", "scanId", "", "enqueueUpsertProfile", "userId", "payloadJson", "enqueueUpsertScan", "failedCount", "", "markAttempt", "id", "ok", "", "error", "pendingCount", "readAll", "snapshot", "upsert", "item", "writeAll", "items", "Companion", "OpKind", "OpStatus", "OutboxItem", "app_debug"})
public final class SyncOutboxStore {
    @org.jetbrains.annotations.NotNull()
    private final android.content.SharedPreferences prefs = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.serialization.json.Json json = null;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String FILE_NAME = "fitsense_sync_outbox";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_ITEMS = "items";
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.sync.SyncOutboxStore.Companion Companion = null;
    
    @javax.inject.Inject()
    public SyncOutboxStore(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> snapshot() {
        return null;
    }
    
    public final int pendingCount() {
        return 0;
    }
    
    public final int failedCount() {
        return 0;
    }
    
    public final void enqueueUpsertScan(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    java.lang.String payloadJson) {
    }
    
    public final void enqueueDeleteScan(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId) {
    }
    
    public final void enqueueUpsertProfile(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    java.lang.String payloadJson) {
    }
    
    public final void markAttempt(@org.jetbrains.annotations.NotNull()
    java.lang.String id, boolean ok, @org.jetbrains.annotations.Nullable()
    java.lang.String error) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> dueItems(long nowEpochMs) {
        return null;
    }
    
    public final void clear() {
    }
    
    private final void upsert(com.fitsense.ai.sync.SyncOutboxStore.OutboxItem item) {
    }
    
    private final java.util.List<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> readAll() {
        return null;
    }
    
    private final void writeAll(java.util.List<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> items) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore$Companion;", "", "()V", "FILE_NAME", "", "KEY_ITEMS", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0002\b\u0005\b\u0086\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002j\u0002\b\u0003j\u0002\b\u0004j\u0002\b\u0005\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore$OpKind;", "", "(Ljava/lang/String;I)V", "UPSERT_SCAN", "DELETE_SCAN", "UPSERT_PROFILE", "app_debug"})
    public static enum OpKind {
        /*public static final*/ UPSERT_SCAN /* = new UPSERT_SCAN() */,
        /*public static final*/ DELETE_SCAN /* = new DELETE_SCAN() */,
        /*public static final*/ UPSERT_PROFILE /* = new UPSERT_PROFILE() */;
        
        OpKind() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public static kotlin.enums.EnumEntries<com.fitsense.ai.sync.SyncOutboxStore.OpKind> getEntries() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0002\b\u0005\b\u0086\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002j\u0002\b\u0003j\u0002\b\u0004j\u0002\b\u0005\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore$OpStatus;", "", "(Ljava/lang/String;I)V", "PENDING", "FAILED", "SYNCED", "app_debug"})
    public static enum OpStatus {
        /*public static final*/ PENDING /* = new PENDING() */,
        /*public static final*/ FAILED /* = new FAILED() */,
        /*public static final*/ SYNCED /* = new SYNCED() */;
        
        OpStatus() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public static kotlin.enums.EnumEntries<com.fitsense.ai.sync.SyncOutboxStore.OpStatus> getEntries() {
            return null;
        }
    }
    
    @kotlinx.serialization.Serializable()
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\t\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0019\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 72\u00020\u0001:\u000267Bm\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u0006\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\b\u001a\u0004\u0018\u00010\u0005\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\u0003\u0012\u0006\u0010\f\u001a\u00020\n\u0012\b\u0010\r\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u000e\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u000f\u001a\u0004\u0018\u00010\u0010\u00a2\u0006\u0002\u0010\u0011B]\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u0012\u0006\u0010\u0007\u001a\u00020\u0005\u0012\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u0005\u0012\b\b\u0002\u0010\t\u001a\u00020\n\u0012\b\b\u0002\u0010\u000b\u001a\u00020\u0003\u0012\b\b\u0002\u0010\f\u001a\u00020\n\u0012\n\b\u0002\u0010\r\u001a\u0004\u0018\u00010\u0005\u0012\b\b\u0002\u0010\u000e\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0012J\t\u0010\u001f\u001a\u00020\u0005H\u00c6\u0003J\t\u0010 \u001a\u00020\u0005H\u00c6\u0003J\t\u0010!\u001a\u00020\u0005H\u00c6\u0003J\u000b\u0010\"\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\t\u0010#\u001a\u00020\nH\u00c6\u0003J\t\u0010$\u001a\u00020\u0003H\u00c6\u0003J\t\u0010%\u001a\u00020\nH\u00c6\u0003J\u000b\u0010&\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\t\u0010\'\u001a\u00020\u0005H\u00c6\u0003Jg\u0010(\u001a\u00020\u00002\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00052\b\b\u0002\u0010\u0007\u001a\u00020\u00052\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u00052\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\u00032\b\b\u0002\u0010\f\u001a\u00020\n2\n\b\u0002\u0010\r\u001a\u0004\u0018\u00010\u00052\b\b\u0002\u0010\u000e\u001a\u00020\u0005H\u00c6\u0001J\u0013\u0010)\u001a\u00020*2\b\u0010+\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010,\u001a\u00020\u0003H\u00d6\u0001J\t\u0010-\u001a\u00020\u0005H\u00d6\u0001J&\u0010.\u001a\u00020/2\u0006\u00100\u001a\u00020\u00002\u0006\u00101\u001a\u0002022\u0006\u00103\u001a\u000204H\u00c1\u0001\u00a2\u0006\u0002\b5R\u0011\u0010\u000b\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0011\u0010\u0007\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0018R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u0018R\u0011\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u0018R\u0013\u0010\r\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u0018R\u0011\u0010\f\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u0016R\u0013\u0010\b\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u0018R\u0011\u0010\u000e\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u0018\u00a8\u00068"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore$OutboxItem;", "", "seen1", "", "id", "", "kind", "entityId", "payloadJson", "createdAtEpochMs", "", "attempts", "nextAttemptEpochMs", "lastError", "status", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(ILjava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JIJLjava/lang/String;Ljava/lang/String;Lkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JIJLjava/lang/String;Ljava/lang/String;)V", "getAttempts", "()I", "getCreatedAtEpochMs", "()J", "getEntityId", "()Ljava/lang/String;", "getId", "getKind", "getLastError", "getNextAttemptEpochMs", "getPayloadJson", "getStatus", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "", "other", "hashCode", "toString", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
    public static final class OutboxItem {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String id = null;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String kind = null;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String entityId = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String payloadJson = null;
        private final long createdAtEpochMs = 0L;
        private final int attempts = 0;
        private final long nextAttemptEpochMs = 0L;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String lastError = null;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String status = null;
        @org.jetbrains.annotations.NotNull()
        public static final com.fitsense.ai.sync.SyncOutboxStore.OutboxItem.Companion Companion = null;
        
        public OutboxItem(@org.jetbrains.annotations.NotNull()
        java.lang.String id, @org.jetbrains.annotations.NotNull()
        java.lang.String kind, @org.jetbrains.annotations.NotNull()
        java.lang.String entityId, @org.jetbrains.annotations.Nullable()
        java.lang.String payloadJson, long createdAtEpochMs, int attempts, long nextAttemptEpochMs, @org.jetbrains.annotations.Nullable()
        java.lang.String lastError, @org.jetbrains.annotations.NotNull()
        java.lang.String status) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getId() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getKind() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getEntityId() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getPayloadJson() {
            return null;
        }
        
        public final long getCreatedAtEpochMs() {
            return 0L;
        }
        
        public final int getAttempts() {
            return 0;
        }
        
        public final long getNextAttemptEpochMs() {
            return 0L;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getLastError() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getStatus() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component3() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component4() {
            return null;
        }
        
        public final long component5() {
            return 0L;
        }
        
        public final int component6() {
            return 0;
        }
        
        public final long component7() {
            return 0L;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component8() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component9() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.sync.SyncOutboxStore.OutboxItem copy(@org.jetbrains.annotations.NotNull()
        java.lang.String id, @org.jetbrains.annotations.NotNull()
        java.lang.String kind, @org.jetbrains.annotations.NotNull()
        java.lang.String entityId, @org.jetbrains.annotations.Nullable()
        java.lang.String payloadJson, long createdAtEpochMs, int attempts, long nextAttemptEpochMs, @org.jetbrains.annotations.Nullable()
        java.lang.String lastError, @org.jetbrains.annotations.NotNull()
        java.lang.String status) {
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
        com.fitsense.ai.sync.SyncOutboxStore.OutboxItem self, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
        kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/fitsense/ai/sync/SyncOutboxStore.OutboxItem.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/fitsense/ai/sync/SyncOutboxStore$OutboxItem;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
        @java.lang.Deprecated()
        public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> {
            @org.jetbrains.annotations.NotNull()
            public static final com.fitsense.ai.sync.SyncOutboxStore.OutboxItem.$serializer INSTANCE = null;
            
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
            public com.fitsense.ai.sync.SyncOutboxStore.OutboxItem deserialize(@org.jetbrains.annotations.NotNull()
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
            com.fitsense.ai.sync.SyncOutboxStore.OutboxItem value) {
            }
            
            @java.lang.Override()
            @org.jetbrains.annotations.NotNull()
            public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
                return null;
            }
        }
        
        @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/sync/SyncOutboxStore$OutboxItem$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/fitsense/ai/sync/SyncOutboxStore$OutboxItem;", "app_debug"})
        public static final class Companion {
            
            private Companion() {
                super();
            }
            
            @org.jetbrains.annotations.NotNull()
            public final kotlinx.serialization.KSerializer<com.fitsense.ai.sync.SyncOutboxStore.OutboxItem> serializer() {
                return null;
            }
        }
    }
}