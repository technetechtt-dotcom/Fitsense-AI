package com.fitsense.ai.viewmodel;

import androidx.lifecycle.ViewModel;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.sync.CloudSyncCoordinator;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.ExperimentalCoroutinesApi;
import kotlinx.coroutines.flow.SharingStarted;
import kotlinx.coroutines.flow.StateFlow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000:\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u001f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\u000e\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0014R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R#\u0010\t\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\f0\u000b0\n\u00a2\u0006\u000e\n\u0000\u0012\u0004\b\r\u0010\u000e\u001a\u0004\b\u000f\u0010\u0010R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0015"}, d2 = {"Lcom/fitsense/ai/viewmodel/MeasurementsViewModel;", "Landroidx/lifecycle/ViewModel;", "userRepository", "Lcom/fitsense/ai/repository/UserRepository;", "scanRepository", "Lcom/fitsense/ai/repository/ScanRepository;", "cloudSyncCoordinator", "Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "(Lcom/fitsense/ai/repository/UserRepository;Lcom/fitsense/ai/repository/ScanRepository;Lcom/fitsense/ai/sync/CloudSyncCoordinator;)V", "scans", "Lkotlinx/coroutines/flow/StateFlow;", "", "Lcom/fitsense/ai/models/ScanResult;", "getScans$annotations", "()V", "getScans", "()Lkotlinx/coroutines/flow/StateFlow;", "delete", "", "scanId", "", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class MeasurementsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.UserRepository userRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.ScanRepository scanRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.fitsense.ai.models.ScanResult>> scans = null;
    
    @javax.inject.Inject()
    public MeasurementsViewModel(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepository userRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ScanRepository scanRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.fitsense.ai.models.ScanResult>> getScans() {
        return null;
    }
    
    @kotlin.OptIn(markerClass = {kotlinx.coroutines.ExperimentalCoroutinesApi.class})
    @java.lang.Deprecated()
    public static void getScans$annotations() {
    }
    
    public final void delete(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId) {
    }
}