package com.fitsense.ai.viewmodel;

import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.models.UiState;
import com.fitsense.ai.models.UserPreferences;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.UserRepository;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.ExperimentalCoroutinesApi;
import kotlinx.coroutines.flow.SharingStarted;
import kotlinx.coroutines.flow.StateFlow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u001f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\b\u0010\u0016\u001a\u00020\u0017H\u0002R\u001a\u0010\t\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\f0\u000b0\nX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000f0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u0011R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001d\u0010\u0014\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\f0\u000b0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0011R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0018"}, d2 = {"Lcom/fitsense/ai/viewmodel/ResultsViewModel;", "Landroidx/lifecycle/ViewModel;", "savedStateHandle", "Landroidx/lifecycle/SavedStateHandle;", "userRepository", "Lcom/fitsense/ai/repository/UserRepository;", "scanRepository", "Lcom/fitsense/ai/repository/ScanRepository;", "(Landroidx/lifecycle/SavedStateHandle;Lcom/fitsense/ai/repository/UserRepository;Lcom/fitsense/ai/repository/ScanRepository;)V", "_state", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/fitsense/ai/models/UiState;", "Lcom/fitsense/ai/models/ScanResult;", "preferences", "Lkotlinx/coroutines/flow/StateFlow;", "Lcom/fitsense/ai/models/UserPreferences;", "getPreferences", "()Lkotlinx/coroutines/flow/StateFlow;", "scanId", "", "state", "getState", "observeScan", "", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class ResultsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.UserRepository userRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.ScanRepository scanRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String scanId = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.fitsense.ai.models.UiState<com.fitsense.ai.models.ScanResult>> _state = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UiState<com.fitsense.ai.models.ScanResult>> state = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserPreferences> preferences = null;
    
    @javax.inject.Inject()
    public ResultsViewModel(@org.jetbrains.annotations.NotNull()
    androidx.lifecycle.SavedStateHandle savedStateHandle, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepository userRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ScanRepository scanRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UiState<com.fitsense.ai.models.ScanResult>> getState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserPreferences> getPreferences() {
        return null;
    }
    
    @kotlin.OptIn(markerClass = {kotlinx.coroutines.ExperimentalCoroutinesApi.class})
    private final void observeScan() {
    }
}