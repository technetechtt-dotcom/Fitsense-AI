package com.fitsense.ai.viewmodel;

import androidx.lifecycle.ViewModel;
import com.fitsense.ai.api.ApiConfig;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.MeasurementUnit;
import com.fitsense.ai.models.UserPreferences;
import com.fitsense.ai.models.UserProfile;
import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.sync.CloudSyncCoordinator;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.SharingStarted;
import kotlinx.coroutines.flow.StateFlow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000t\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0006\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u0006\u0010\u0018\u001a\u00020\u0019J\u0006\u0010\u001a\u001a\u00020\u0019J\u001c\u0010\u001b\u001a\u00020\u00192\u0012\u0010\u001c\u001a\u000e\u0012\u0004\u0012\u00020\u001e\u0012\u0004\u0012\u00020\u001e0\u001dH\u0002J\u0006\u0010\u001f\u001a\u00020\u0019J\u0006\u0010 \u001a\u00020\u0019J\u0006\u0010!\u001a\u00020\u0019J\u000e\u0010\"\u001a\u00020\u00192\u0006\u0010#\u001a\u00020$J\u000e\u0010%\u001a\u00020\u00192\u0006\u0010&\u001a\u00020\'J\u000e\u0010(\u001a\u00020\u00192\u0006\u0010#\u001a\u00020$J)\u0010)\u001a\u00020\u00192\b\u0010*\u001a\u0004\u0018\u00010+2\b\u0010,\u001a\u0004\u0018\u00010+2\b\u0010-\u001a\u0004\u0018\u00010\t\u00a2\u0006\u0002\u0010.J\u000e\u0010/\u001a\u00020\u00192\u0006\u00100\u001a\u000201J\u0014\u00102\u001a\u00020\u00192\f\u00103\u001a\b\u0012\u0004\u0012\u00020\u001904R\u0016\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\f0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0019\u0010\r\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0019\u0010\u0011\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00120\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0010R\u0019\u0010\u0014\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0010R\u0017\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\f0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0010R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u00065"}, d2 = {"Lcom/fitsense/ai/viewmodel/SettingsViewModel;", "Landroidx/lifecycle/ViewModel;", "userRepository", "Lcom/fitsense/ai/repository/UserRepository;", "cloudSyncCoordinator", "Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "(Lcom/fitsense/ai/repository/UserRepository;Lcom/fitsense/ai/sync/CloudSyncCoordinator;)V", "_exportPreview", "Lkotlinx/coroutines/flow/MutableStateFlow;", "", "_statusMessage", "_syncStatus", "Lcom/fitsense/ai/sync/CloudSyncCoordinator$SyncStatus;", "exportPreview", "Lkotlinx/coroutines/flow/StateFlow;", "getExportPreview", "()Lkotlinx/coroutines/flow/StateFlow;", "profile", "Lcom/fitsense/ai/models/UserProfile;", "getProfile", "statusMessage", "getStatusMessage", "syncStatus", "getSyncStatus", "eraseCloudData", "", "exportCloudData", "mutatePrefs", "transform", "Lkotlin/Function1;", "Lcom/fitsense/ai/models/UserPreferences;", "pullFromCloud", "refreshSyncStatus", "retryPendingSync", "setAnalyticsOptIn", "enabled", "", "setCalibration", "ref", "Lcom/fitsense/ai/models/CalibrationReference;", "setCloudSyncOptIn", "setGroundTruth", "lengthMm", "", "widthMm", "notes", "(Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/String;)V", "setUnits", "units", "Lcom/fitsense/ai/models/MeasurementUnit;", "signOut", "onSignedOut", "Lkotlin/Function0;", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class SettingsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.UserRepository userRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserProfile> profile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus> _syncStatus = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus> syncStatus = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.lang.String> _statusMessage = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.lang.String> statusMessage = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.lang.String> _exportPreview = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.lang.String> exportPreview = null;
    
    @javax.inject.Inject()
    public SettingsViewModel(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepository userRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.models.UserProfile> getProfile() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.sync.CloudSyncCoordinator.SyncStatus> getSyncStatus() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.lang.String> getStatusMessage() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.lang.String> getExportPreview() {
        return null;
    }
    
    public final void setUnits(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.MeasurementUnit units) {
    }
    
    public final void setCalibration(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference ref) {
    }
    
    public final void setAnalyticsOptIn(boolean enabled) {
    }
    
    public final void setCloudSyncOptIn(boolean enabled) {
    }
    
    public final void setGroundTruth(@org.jetbrains.annotations.Nullable()
    java.lang.Double lengthMm, @org.jetbrains.annotations.Nullable()
    java.lang.Double widthMm, @org.jetbrains.annotations.Nullable()
    java.lang.String notes) {
    }
    
    public final void refreshSyncStatus() {
    }
    
    public final void retryPendingSync() {
    }
    
    public final void pullFromCloud() {
    }
    
    public final void exportCloudData() {
    }
    
    public final void eraseCloudData() {
    }
    
    public final void signOut(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onSignedOut) {
    }
    
    private final void mutatePrefs(kotlin.jvm.functions.Function1<? super com.fitsense.ai.models.UserPreferences, com.fitsense.ai.models.UserPreferences> transform) {
    }
}