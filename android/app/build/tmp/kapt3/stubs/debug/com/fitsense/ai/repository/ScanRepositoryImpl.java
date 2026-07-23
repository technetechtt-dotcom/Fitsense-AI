package com.fitsense.ai.repository;

import com.fitsense.ai.local.LocalScanStore;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.utils.DataResult;
import kotlinx.coroutines.flow.Flow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00004\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0004\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J$\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\tH\u0096@\u00a2\u0006\u0002\u0010\u000bJ\u001e\u0010\f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000f0\u000e0\r2\b\u0010\b\u001a\u0004\u0018\u00010\tH\u0016J\u001c\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u000f0\u00062\u0006\u0010\u0011\u001a\u00020\u000fH\u0096@\u00a2\u0006\u0002\u0010\u0012R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0013"}, d2 = {"Lcom/fitsense/ai/repository/ScanRepositoryImpl;", "Lcom/fitsense/ai/repository/ScanRepository;", "scanStore", "Lcom/fitsense/ai/local/LocalScanStore;", "(Lcom/fitsense/ai/local/LocalScanStore;)V", "deleteScan", "Lcom/fitsense/ai/utils/DataResult;", "", "userId", "", "scanId", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "observeScans", "Lkotlinx/coroutines/flow/Flow;", "", "Lcom/fitsense/ai/models/ScanResult;", "saveScan", "scan", "(Lcom/fitsense/ai/models/ScanResult;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class ScanRepositoryImpl implements com.fitsense.ai.repository.ScanRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.local.LocalScanStore scanStore = null;
    
    @javax.inject.Inject()
    public ScanRepositoryImpl(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.local.LocalScanStore scanStore) {
        super();
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public kotlinx.coroutines.flow.Flow<java.util.List<com.fitsense.ai.models.ScanResult>> observeScans(@org.jetbrains.annotations.Nullable()
    java.lang.String userId) {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object saveScan(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.ScanResult scan, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<com.fitsense.ai.models.ScanResult>> $completion) {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object deleteScan(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<kotlin.Unit>> $completion) {
        return null;
    }
}