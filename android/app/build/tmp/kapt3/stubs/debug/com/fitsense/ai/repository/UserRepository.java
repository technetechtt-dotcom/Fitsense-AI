package com.fitsense.ai.repository;

import com.fitsense.ai.local.DeviceIdentityService;
import com.fitsense.ai.local.LocalUserStore;
import com.fitsense.ai.models.UserPreferences;
import com.fitsense.ai.models.UserProfile;
import com.fitsense.ai.utils.AppError;
import com.fitsense.ai.utils.DataResult;
import kotlinx.coroutines.flow.Flow;
import javax.inject.Inject;

/**
 * Source of truth for the authenticated user.
 *
 * - Backed by [DeviceIdentityService] for a stable on-device identity.
 * - Backed by [LocalUserStore] for profile + preferences.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J$\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b2\u0006\u0010\n\u001a\u00020\u000b2\u0006\u0010\f\u001a\u00020\u000bH\u00a6@\u00a2\u0006\u0002\u0010\rJ\u0014\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00040\bH\u00a6@\u00a2\u0006\u0002\u0010\u000fJ\u0014\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\t0\bH\u00a6@\u00a2\u0006\u0002\u0010\u000fJ\u001c\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\t0\b2\u0006\u0010\u0012\u001a\u00020\u0013H\u00a6@\u00a2\u0006\u0002\u0010\u0014R\u001a\u0010\u0002\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00040\u0003X\u00a6\u0004\u00a2\u0006\u0006\u001a\u0004\b\u0005\u0010\u0006\u00a8\u0006\u0015"}, d2 = {"Lcom/fitsense/ai/repository/UserRepository;", "", "profile", "Lkotlinx/coroutines/flow/Flow;", "Lcom/fitsense/ai/models/UserProfile;", "getProfile", "()Lkotlinx/coroutines/flow/Flow;", "cacheLatestFootMetrics", "Lcom/fitsense/ai/utils/DataResult;", "", "lengthMm", "", "widthMm", "(DDLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "ensureSignedIn", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "signOut", "updatePreferences", "preferences", "Lcom/fitsense/ai/models/UserPreferences;", "(Lcom/fitsense/ai/models/UserPreferences;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface UserRepository {
    
    @org.jetbrains.annotations.NotNull()
    public abstract kotlinx.coroutines.flow.Flow<com.fitsense.ai.models.UserProfile> getProfile();
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object ensureSignedIn(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<com.fitsense.ai.models.UserProfile>> $completion);
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object updatePreferences(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.UserPreferences preferences, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion);
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object cacheLatestFootMetrics(double lengthMm, double widthMm, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion);
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object signOut(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion);
}