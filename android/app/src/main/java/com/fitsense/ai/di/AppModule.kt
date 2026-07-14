package com.fitsense.ai.di

import android.content.Context
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import com.fitsense.ai.measurement.CalibrationEngine
import com.fitsense.ai.measurement.MeasurementEngine
import com.fitsense.ai.measurement.UnitConverter
import com.fitsense.ai.recommendation.RecommendationEngine
import com.fitsense.ai.recommendation.ShoeCatalog
import com.fitsense.ai.vision.FootContourDetector
import com.fitsense.ai.vision.ImagePreprocessor
import com.fitsense.ai.vision.OpenCvInitializer
import com.fitsense.ai.vision.PerspectiveCorrection
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import javax.inject.Qualifier
import javax.inject.Singleton

/**
 * Application-wide bindings for FitSense AI: vision pipeline collaborators,
 * measurement & recommendation engines, app-scope coroutines, and DataStore.
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // ---- Coroutine plumbing -------------------------------------------------

    @IoDispatcher
    @Provides
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @DefaultDispatcher
    @Provides
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default

    @ApplicationScope
    @Provides
    @Singleton
    fun provideApplicationScope(@IoDispatcher dispatcher: CoroutineDispatcher): CoroutineScope =
        CoroutineScope(SupervisorJob() + dispatcher)

    // ---- DataStore ----------------------------------------------------------

    @Provides
    @Singleton
    fun providePreferencesDataStore(
        @ApplicationContext context: Context,
    ): androidx.datastore.core.DataStore<Preferences> = PreferenceDataStoreFactory.create(
        produceFile = { context.preferencesDataStoreFile("fitsense_prefs") },
    )

    // ---- Vision pipeline ----------------------------------------------------

    @Provides
    @Singleton
    fun provideOpenCvInitializer(): OpenCvInitializer = OpenCvInitializer()

    @Provides
    @Singleton
    fun provideImagePreprocessor(): ImagePreprocessor = ImagePreprocessor()

    @Provides
    @Singleton
    fun providePerspectiveCorrection(): PerspectiveCorrection = PerspectiveCorrection()

    @Provides
    @Singleton
    fun provideFootContourDetector(
        preprocessor: ImagePreprocessor,
    ): FootContourDetector = FootContourDetector(preprocessor)

    // ---- Measurement & recommendation --------------------------------------

    @Provides
    @Singleton
    fun provideUnitConverter(): UnitConverter = UnitConverter()

    @Provides
    @Singleton
    fun provideCalibrationEngine(): CalibrationEngine = CalibrationEngine()

    @Provides
    @Singleton
    fun provideMeasurementEngine(
        contourDetector: FootContourDetector,
        calibrationEngine: CalibrationEngine,
        unitConverter: UnitConverter,
    ): MeasurementEngine = MeasurementEngine(contourDetector, calibrationEngine, unitConverter)

    @Provides
    @Singleton
    fun provideShoeCatalog(): ShoeCatalog = ShoeCatalog()

    @Provides
    @Singleton
    fun provideRecommendationEngine(
        catalog: ShoeCatalog,
    ): RecommendationEngine = RecommendationEngine(catalog)
}

@Qualifier @Retention(AnnotationRetention.BINARY) annotation class IoDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class DefaultDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class ApplicationScope
