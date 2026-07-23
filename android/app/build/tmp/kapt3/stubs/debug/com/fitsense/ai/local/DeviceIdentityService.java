package com.fitsense.ai.local;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
import com.fitsense.ai.utils.AppError;
import com.fitsense.ai.utils.DataResult;
import java.util.UUID;
import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * Stable on-device identity used as the user id for local persistence.
 */
@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000*\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\b\u0007\u0018\u0000 \f2\u00020\u0001:\u0001\fB\u0015\b\u0007\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\u0002\u0010\u0005J\u0014\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\b0\u0007H\u0086@\u00a2\u0006\u0002\u0010\tJ\u0014\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u000b0\u0007H\u0086@\u00a2\u0006\u0002\u0010\tR\u0014\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\r"}, d2 = {"Lcom/fitsense/ai/local/DeviceIdentityService;", "", "dataStore", "Landroidx/datastore/core/DataStore;", "Landroidx/datastore/preferences/core/Preferences;", "(Landroidx/datastore/core/DataStore;)V", "clearDeviceId", "Lcom/fitsense/ai/utils/DataResult;", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getOrCreateDeviceId", "", "Companion", "app_debug"})
public final class DeviceIdentityService {
    @org.jetbrains.annotations.NotNull()
    private final androidx.datastore.core.DataStore<androidx.datastore.preferences.core.Preferences> dataStore = null;
    @org.jetbrains.annotations.NotNull()
    private static final androidx.datastore.preferences.core.Preferences.Key<java.lang.String> DEVICE_ID_KEY = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.local.DeviceIdentityService.Companion Companion = null;
    
    @javax.inject.Inject()
    public DeviceIdentityService(@org.jetbrains.annotations.NotNull()
    androidx.datastore.core.DataStore<androidx.datastore.preferences.core.Preferences> dataStore) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getOrCreateDeviceId(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<java.lang.String>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object clearDeviceId(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u0014\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/local/DeviceIdentityService$Companion;", "", "()V", "DEVICE_ID_KEY", "Landroidx/datastore/preferences/core/Preferences$Key;", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}