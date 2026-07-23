package com.fitsense.ai;

import android.app.Application;
import com.fitsense.ai.vision.OpenCvInitializer;
import dagger.hilt.android.HiltAndroidApp;
import timber.log.Timber;
import javax.inject.Inject;

/**
 * FitSense AI application entry point.
 *
 * Responsibilities:
 * • Bootstraps Hilt's object graph
 * • Initializes Timber logging (debug only)
 * • Triggers asynchronous OpenCV native library load so the vision pipeline
 *   is ready by the time the user enters the scan flow.
 */
@dagger.hilt.android.HiltAndroidApp()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u0002\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\b\u0010\u000f\u001a\u00020\u0010H\u0016R\u001e\u0010\u0003\u001a\u00020\u00048\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0005\u0010\u0006\"\u0004\b\u0007\u0010\bR\u001e\u0010\t\u001a\u00020\n8\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u000b\u0010\f\"\u0004\b\r\u0010\u000e\u00a8\u0006\u0011"}, d2 = {"Lcom/fitsense/ai/FitSenseApp;", "Landroid/app/Application;", "()V", "cloudSyncCoordinator", "Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "getCloudSyncCoordinator", "()Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "setCloudSyncCoordinator", "(Lcom/fitsense/ai/sync/CloudSyncCoordinator;)V", "openCvInitializer", "Lcom/fitsense/ai/vision/OpenCvInitializer;", "getOpenCvInitializer", "()Lcom/fitsense/ai/vision/OpenCvInitializer;", "setOpenCvInitializer", "(Lcom/fitsense/ai/vision/OpenCvInitializer;)V", "onCreate", "", "app_debug"})
public final class FitSenseApp extends android.app.Application {
    @javax.inject.Inject()
    public com.fitsense.ai.vision.OpenCvInitializer openCvInitializer;
    @javax.inject.Inject()
    public com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator;
    
    public FitSenseApp() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.OpenCvInitializer getOpenCvInitializer() {
        return null;
    }
    
    public final void setOpenCvInitializer(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.OpenCvInitializer p0) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.sync.CloudSyncCoordinator getCloudSyncCoordinator() {
        return null;
    }
    
    public final void setCloudSyncCoordinator(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.CloudSyncCoordinator p0) {
    }
    
    @java.lang.Override()
    public void onCreate() {
    }
}