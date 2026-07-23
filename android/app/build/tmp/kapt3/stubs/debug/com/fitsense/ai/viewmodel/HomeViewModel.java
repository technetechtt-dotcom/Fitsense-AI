package com.fitsense.ai.viewmodel;

import androidx.lifecycle.ViewModel;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.models.UserProfile;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.UserRepository;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.ExperimentalCoroutinesApi;
import kotlinx.coroutines.flow.SharingStarted;
import kotlinx.coroutines.flow.StateFlow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006R\u0019\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR#\u0010\f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000e0\r0\b\u00a2\u0006\u000e\n\u0000\u0012\u0004\b\u000f\u0010\u0010\u001a\u0004\b\u0011\u0010\u000bR\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0012"}, d2 = {"Lcom/fitsense/ai/viewmodel/HomeViewModel;", "Landroidx/lifecycle/ViewModel;", "userRepository", "Lcom/fitsense/ai/repository/UserRepository;", "scanRepository", "Lcom/fitsense/ai/repository/ScanRepository;", "(Lcom/fitsense/ai/repository/UserRepository;Lcom/fitsense/ai/repository/ScanRepository;)V", "profile", "Lkotlinx/coroutines/flow/StateFlow;", "Lcom/fitsense/ai/models/UserProfile;", "getProfile", "()Lkotlinx/coroutines/flow/StateFlow;", "recentScans", "", "Lcom/fitsense/ai/models/ScanResult;", "getRecentScans$annotations", "()V", "getRecentScans", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class HomeViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.UserRepository userRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.ScanRepository scanRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserProfile> profile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.fitsense.ai.models.ScanResult>> recentScans = null;
    
    @javax.inject.Inject()
    public HomeViewModel(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepository userRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ScanRepository scanRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserProfile> getProfile() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.fitsense.ai.models.ScanResult>> getRecentScans() {
        return null;
    }
    
    @kotlin.OptIn(markerClass = {kotlinx.coroutines.ExperimentalCoroutinesApi.class})
    @java.lang.Deprecated()
    public static void getRecentScans$annotations() {
    }
}