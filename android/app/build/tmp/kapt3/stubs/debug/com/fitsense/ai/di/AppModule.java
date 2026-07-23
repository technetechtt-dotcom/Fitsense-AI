package com.fitsense.ai.di;

import android.content.Context;
import androidx.datastore.preferences.core.PreferenceDataStoreFactory;
import androidx.datastore.preferences.core.Preferences;
import com.fitsense.ai.measurement.CalibrationEngine;
import com.fitsense.ai.measurement.MeasurementEngine;
import com.fitsense.ai.measurement.UnitConverter;
import com.fitsense.ai.recommendation.RecommendationEngine;
import com.fitsense.ai.recommendation.ShoeCatalog;
import com.fitsense.ai.vision.FootContourDetector;
import com.fitsense.ai.vision.ImagePreprocessor;
import com.fitsense.ai.vision.OpenCvInitializer;
import com.fitsense.ai.vision.PerspectiveCorrection;
import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;
import kotlinx.coroutines.CoroutineDispatcher;
import kotlinx.coroutines.Dispatchers;
import javax.inject.Qualifier;
import javax.inject.Singleton;

/**
 * Application-wide bindings for FitSense AI: vision pipeline collaborators,
 * measurement & recommendation engines, app-scope coroutines, and DataStore.
 */
@dagger.Module()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000f\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u0012\u0010\u0003\u001a\u00020\u00042\b\b\u0001\u0010\u0005\u001a\u00020\u0006H\u0007J\b\u0010\u0007\u001a\u00020\bH\u0007J\b\u0010\t\u001a\u00020\u0006H\u0007J\u0010\u0010\n\u001a\u00020\u000b2\u0006\u0010\f\u001a\u00020\rH\u0007J\b\u0010\u000e\u001a\u00020\rH\u0007J\b\u0010\u000f\u001a\u00020\u0006H\u0007J \u0010\u0010\u001a\u00020\u00112\u0006\u0010\u0012\u001a\u00020\u000b2\u0006\u0010\u0013\u001a\u00020\b2\u0006\u0010\u0014\u001a\u00020\u0015H\u0007J\b\u0010\u0016\u001a\u00020\u0017H\u0007J\b\u0010\u0018\u001a\u00020\u0019H\u0007J\u0018\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u001c0\u001b2\b\b\u0001\u0010\u001d\u001a\u00020\u001eH\u0007J\u0010\u0010\u001f\u001a\u00020 2\u0006\u0010!\u001a\u00020\"H\u0007J\b\u0010#\u001a\u00020\"H\u0007J\b\u0010$\u001a\u00020\u0015H\u0007\u00a8\u0006%"}, d2 = {"Lcom/fitsense/ai/di/AppModule;", "", "()V", "provideApplicationScope", "Lkotlinx/coroutines/CoroutineScope;", "dispatcher", "Lkotlinx/coroutines/CoroutineDispatcher;", "provideCalibrationEngine", "Lcom/fitsense/ai/measurement/CalibrationEngine;", "provideDefaultDispatcher", "provideFootContourDetector", "Lcom/fitsense/ai/vision/FootContourDetector;", "preprocessor", "Lcom/fitsense/ai/vision/ImagePreprocessor;", "provideImagePreprocessor", "provideIoDispatcher", "provideMeasurementEngine", "Lcom/fitsense/ai/measurement/MeasurementEngine;", "contourDetector", "calibrationEngine", "unitConverter", "Lcom/fitsense/ai/measurement/UnitConverter;", "provideOpenCvInitializer", "Lcom/fitsense/ai/vision/OpenCvInitializer;", "providePerspectiveCorrection", "Lcom/fitsense/ai/vision/PerspectiveCorrection;", "providePreferencesDataStore", "Landroidx/datastore/core/DataStore;", "Landroidx/datastore/preferences/core/Preferences;", "context", "Landroid/content/Context;", "provideRecommendationEngine", "Lcom/fitsense/ai/recommendation/RecommendationEngine;", "catalog", "Lcom/fitsense/ai/recommendation/ShoeCatalog;", "provideShoeCatalog", "provideUnitConverter", "app_debug"})
@dagger.hilt.InstallIn(value = {dagger.hilt.components.SingletonComponent.class})
public final class AppModule {
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.di.AppModule INSTANCE = null;
    
    private AppModule() {
        super();
    }
    
    @dagger.Provides()
    @IoDispatcher()
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.CoroutineDispatcher provideIoDispatcher() {
        return null;
    }
    
    @dagger.Provides()
    @DefaultDispatcher()
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.CoroutineDispatcher provideDefaultDispatcher() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @ApplicationScope()
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.CoroutineScope provideApplicationScope(@IoDispatcher()
    @org.jetbrains.annotations.NotNull()
    kotlinx.coroutines.CoroutineDispatcher dispatcher) {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final androidx.datastore.core.DataStore<androidx.datastore.preferences.core.Preferences> providePreferencesDataStore(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.OpenCvInitializer provideOpenCvInitializer() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.ImagePreprocessor provideImagePreprocessor() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.PerspectiveCorrection providePerspectiveCorrection() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.vision.FootContourDetector provideFootContourDetector(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ImagePreprocessor preprocessor) {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.UnitConverter provideUnitConverter() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.CalibrationEngine provideCalibrationEngine() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.measurement.MeasurementEngine provideMeasurementEngine(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.FootContourDetector contourDetector, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.CalibrationEngine calibrationEngine, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.UnitConverter unitConverter) {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.recommendation.ShoeCatalog provideShoeCatalog() {
        return null;
    }
    
    @dagger.Provides()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.recommendation.RecommendationEngine provideRecommendationEngine(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.recommendation.ShoeCatalog catalog) {
        return null;
    }
}