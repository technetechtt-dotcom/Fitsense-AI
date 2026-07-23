package com.fitsense.ai.sync;

import com.fitsense.ai.api.ApiConfig;
import com.fitsense.ai.auth.DeviceAuthClient;
import com.fitsense.ai.local.LocalScanStore;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.models.UserProfile;
import kotlinx.serialization.json.JsonObject;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Coordinates optional cloud auth/sync when API + user consent allow.
 * Owns the offline outbox flush path (exponential backoff, no silent drop).
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000h\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001:\u0001*B\'\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u00a2\u0006\u0002\u0010\nJ\u000e\u0010\r\u001a\u00020\u000eH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u001e\u0010\u0010\u001a\u00020\u000e2\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010\u0015J\u001e\u0010\u0016\u001a\u00020\u000e2\u0006\u0010\u0017\u001a\u00020\u00182\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010\u0019J\u001e\u0010\u001a\u001a\u00020\u00142\u0006\u0010\u001b\u001a\u00020\u001c2\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010\u001dJ\u000e\u0010\u001e\u001a\u00020\u001fH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0016\u0010 \u001a\u00020\u00142\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010!J\u0018\u0010\"\u001a\u0004\u0018\u00010\u00122\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010!J\u000e\u0010#\u001a\u00020\u001fH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0016\u0010$\u001a\u00020%2\u0006\u0010\u0013\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010!J\u0012\u0010&\u001a\u0004\u0018\u00010\u001c2\u0006\u0010\'\u001a\u00020(H\u0002J\u000e\u0010)\u001a\u00020\u000eH\u0086@\u00a2\u0006\u0002\u0010\u000fR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006+"}, d2 = {"Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "", "authClient", "Lcom/fitsense/ai/auth/DeviceAuthClient;", "syncClient", "Lcom/fitsense/ai/sync/SyncClient;", "outbox", "Lcom/fitsense/ai/sync/SyncOutboxStore;", "scanStore", "Lcom/fitsense/ai/local/LocalScanStore;", "(Lcom/fitsense/ai/auth/DeviceAuthClient;Lcom/fitsense/ai/sync/SyncClient;Lcom/fitsense/ai/sync/SyncOutboxStore;Lcom/fitsense/ai/local/LocalScanStore;)V", "flushMutex", "Lkotlinx/coroutines/sync/Mutex;", "clearAuth", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "enqueueDeleteScan", "scanId", "", "cloudSyncEnabled", "", "(Ljava/lang/String;ZLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "enqueueProfile", "profile", "Lcom/fitsense/ai/models/UserProfile;", "(Lcom/fitsense/ai/models/UserProfile;ZLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "enqueueScan", "scan", "Lcom/fitsense/ai/models/ScanResult;", "(Lcom/fitsense/ai/models/ScanResult;ZLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "ensureAuthenticated", "Lcom/fitsense/ai/sync/CloudSyncCoordinator$SyncStatus;", "eraseCloudIfEnabled", "(ZLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "exportCloudIfEnabled", "flushOutbox", "pullAndMerge", "", "scanFromJson", "obj", "Lkotlinx/serialization/json/JsonObject;", "signOut", "SyncStatus", "app_debug"})
public final class CloudSyncCoordinator {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.auth.DeviceAuthClient authClient = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.sync.SyncClient syncClient = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.sync.SyncOutboxStore outbox = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.local.LocalScanStore scanStore = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.sync.Mutex flushMutex = null;
    
    @javax.inject.Inject()
    public CloudSyncCoordinator(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.auth.DeviceAuthClient authClient, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.SyncClient syncClient, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.SyncOutboxStore outbox, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.local.LocalScanStore scanStore) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object ensureAuthenticated(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus> $completion) {
        return null;
    }
    
    /**
     * Enqueue scan for sync; attempt immediate flush. Never drops the op on failure.
     */
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object enqueueScan(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.ScanResult scan, boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object enqueueDeleteScan(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId, boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object enqueueProfile(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.UserProfile profile, boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object flushOutbox(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus> $completion) {
        return null;
    }
    
    /**
     * Pull cloud scans and merge into local store (upsert by scanId).
     */
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object pullAndMerge(boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Integer> $completion) {
        return null;
    }
    
    private final com.fitsense.ai.models.ScanResult scanFromJson(kotlinx.serialization.json.JsonObject obj) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object eraseCloudIfEnabled(boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object exportCloudIfEnabled(boolean cloudSyncEnabled, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object signOut(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object clearAuth(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0014\b\u0086\b\u0018\u00002\u00020\u0001B5\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0005\u001a\u00020\u0006\u0012\b\b\u0002\u0010\u0007\u001a\u00020\u0006\u0012\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0013\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\u0006H\u00c6\u0003J\u000b\u0010\u0017\u001a\u0004\u0018\u00010\tH\u00c6\u0003J=\u0010\u0018\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u00062\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\tH\u00c6\u0001J\u0013\u0010\u0019\u001a\u00020\u00032\b\u0010\u001a\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001b\u001a\u00020\u0006H\u00d6\u0001J\t\u0010\u001c\u001a\u00020\tH\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\fR\u0011\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u0011R\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u000f\u00a8\u0006\u001d"}, d2 = {"Lcom/fitsense/ai/sync/CloudSyncCoordinator$SyncStatus;", "", "apiConfigured", "", "authenticated", "pendingOps", "", "failedOps", "lastError", "", "(ZZIILjava/lang/String;)V", "getApiConfigured", "()Z", "getAuthenticated", "getFailedOps", "()I", "getLastError", "()Ljava/lang/String;", "getPendingOps", "component1", "component2", "component3", "component4", "component5", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
    public static final class SyncStatus {
        private final boolean apiConfigured = false;
        private final boolean authenticated = false;
        private final int pendingOps = 0;
        private final int failedOps = 0;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String lastError = null;
        
        public SyncStatus(boolean apiConfigured, boolean authenticated, int pendingOps, int failedOps, @org.jetbrains.annotations.Nullable()
        java.lang.String lastError) {
            super();
        }
        
        public final boolean getApiConfigured() {
            return false;
        }
        
        public final boolean getAuthenticated() {
            return false;
        }
        
        public final int getPendingOps() {
            return 0;
        }
        
        public final int getFailedOps() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getLastError() {
            return null;
        }
        
        public final boolean component1() {
            return false;
        }
        
        public final boolean component2() {
            return false;
        }
        
        public final int component3() {
            return 0;
        }
        
        public final int component4() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus copy(boolean apiConfigured, boolean authenticated, int pendingOps, int failedOps, @org.jetbrains.annotations.Nullable()
        java.lang.String lastError) {
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
    }
}