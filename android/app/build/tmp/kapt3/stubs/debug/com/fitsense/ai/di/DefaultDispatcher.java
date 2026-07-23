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

@javax.inject.Qualifier()
@kotlin.annotation.Retention(value = kotlin.annotation.AnnotationRetention.BINARY)
@java.lang.annotation.Retention(value = java.lang.annotation.RetentionPolicy.CLASS)
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\n\n\u0002\u0018\u0002\n\u0002\u0010\u001b\n\u0000\b\u0087\u0002\u0018\u00002\u00020\u0001B\u0000\u00a8\u0006\u0002"}, d2 = {"Lcom/fitsense/ai/di/DefaultDispatcher;", "", "app_debug"})
public abstract @interface DefaultDispatcher {
}