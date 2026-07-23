package com.fitsense.ai.api;

import com.fitsense.ai.BuildConfig;

/**
 * FitSense API origin. Prefer `local.properties` key `fitsense.api.baseUrl`
 * injected into BuildConfig; empty disables cloud auth/sync.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u0013\u0010\u0003\u001a\u0004\u0018\u00010\u00048F\u00a2\u0006\u0006\u001a\u0004\b\u0005\u0010\u0006R\u0011\u0010\u0007\u001a\u00020\b8F\u00a2\u0006\u0006\u001a\u0004\b\u0007\u0010\t\u00a8\u0006\n"}, d2 = {"Lcom/fitsense/ai/api/ApiConfig;", "", "()V", "baseUrl", "", "getBaseUrl", "()Ljava/lang/String;", "isConfigured", "", "()Z", "app_debug"})
public final class ApiConfig {
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.api.ApiConfig INSTANCE = null;
    
    private ApiConfig() {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getBaseUrl() {
        return null;
    }
    
    public final boolean isConfigured() {
        return false;
    }
}