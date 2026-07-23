package com.fitsense.ai.repository;

import com.fitsense.ai.local.DeviceIdentityService;
import com.fitsense.ai.local.LocalUserStore;
import com.fitsense.ai.models.UserPreferences;
import com.fitsense.ai.models.UserProfile;
import com.fitsense.ai.utils.AppError;
import com.fitsense.ai.utils.DataResult;
import kotlinx.coroutines.flow.Flow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000D\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J$\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0012H\u0096@\u00a2\u0006\u0002\u0010\u0014J\u0014\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\t0\u000fH\u0096@\u00a2\u0006\u0002\u0010\u0016J\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00100\u000fH\u0096@\u00a2\u0006\u0002\u0010\u0016J\u001c\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0019\u001a\u00020\u001aH\u0096@\u00a2\u0006\u0002\u0010\u001bR\u0016\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001c\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\u000bX\u0096\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u001c"}, d2 = {"Lcom/fitsense/ai/repository/UserRepositoryImpl;", "Lcom/fitsense/ai/repository/UserRepository;", "identityService", "Lcom/fitsense/ai/local/DeviceIdentityService;", "userStore", "Lcom/fitsense/ai/local/LocalUserStore;", "(Lcom/fitsense/ai/local/DeviceIdentityService;Lcom/fitsense/ai/local/LocalUserStore;)V", "_profile", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/fitsense/ai/models/UserProfile;", "profile", "Lkotlinx/coroutines/flow/Flow;", "getProfile", "()Lkotlinx/coroutines/flow/Flow;", "cacheLatestFootMetrics", "Lcom/fitsense/ai/utils/DataResult;", "", "lengthMm", "", "widthMm", "(DDLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "ensureSignedIn", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "signOut", "updatePreferences", "preferences", "Lcom/fitsense/ai/models/UserPreferences;", "(Lcom/fitsense/ai/models/UserPreferences;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class UserRepositoryImpl implements com.fitsense.ai.repository.UserRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.local.DeviceIdentityService identityService = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.local.LocalUserStore userStore = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.fitsense.ai.models.UserProfile> _profile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.Flow<com.fitsense.ai.models.UserProfile> profile = null;
    
    @javax.inject.Inject()
    public UserRepositoryImpl(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.local.DeviceIdentityService identityService, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.local.LocalUserStore userStore) {
        super();
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public kotlinx.coroutines.flow.Flow<com.fitsense.ai.models.UserProfile> getProfile() {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object ensureSignedIn(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<com.fitsense.ai.models.UserProfile>> $completion) {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object updatePreferences(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.UserPreferences preferences, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion) {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object cacheLatestFootMetrics(double lengthMm, double widthMm, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion) {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object signOut(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion) {
        return null;
    }
}