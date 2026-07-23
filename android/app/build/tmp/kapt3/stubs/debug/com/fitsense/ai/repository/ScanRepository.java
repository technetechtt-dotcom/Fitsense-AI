package com.fitsense.ai.repository;

import com.fitsense.ai.local.LocalScanStore;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.utils.DataResult;
import kotlinx.coroutines.flow.Flow;
import javax.inject.Inject;

/**
 * Persists scans locally on device.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0004\bf\u0018\u00002\u00020\u0001J$\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u0006H\u00a6@\u00a2\u0006\u0002\u0010\bJ\u001e\u0010\t\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\f0\u000b0\n2\b\u0010\u0005\u001a\u0004\u0018\u00010\u0006H&J\u001c\u0010\r\u001a\b\u0012\u0004\u0012\u00020\f0\u00032\u0006\u0010\u000e\u001a\u00020\fH\u00a6@\u00a2\u0006\u0002\u0010\u000f\u00a8\u0006\u0010"}, d2 = {"Lcom/fitsense/ai/repository/ScanRepository;", "", "deleteScan", "Lcom/fitsense/ai/utils/DataResult;", "", "userId", "", "scanId", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "observeScans", "Lkotlinx/coroutines/flow/Flow;", "", "Lcom/fitsense/ai/models/ScanResult;", "saveScan", "scan", "(Lcom/fitsense/ai/models/ScanResult;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface ScanRepository {
    
    @org.jetbrains.annotations.NotNull()
    public abstract kotlinx.coroutines.flow.Flow<java.util.List<com.fitsense.ai.models.ScanResult>> observeScans(@org.jetbrains.annotations.Nullable()
    java.lang.String userId);
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object saveScan(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.ScanResult scan, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<com.fitsense.ai.models.ScanResult>> $completion);
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object deleteScan(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion);
}