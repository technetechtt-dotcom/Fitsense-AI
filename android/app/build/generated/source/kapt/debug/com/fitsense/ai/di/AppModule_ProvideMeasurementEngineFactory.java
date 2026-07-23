package com.fitsense.ai.di;

import com.fitsense.ai.measurement.CalibrationEngine;
import com.fitsense.ai.measurement.MeasurementEngine;
import com.fitsense.ai.measurement.UnitConverter;
import com.fitsense.ai.vision.FootContourDetector;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class AppModule_ProvideMeasurementEngineFactory implements Factory<MeasurementEngine> {
  private final Provider<FootContourDetector> contourDetectorProvider;

  private final Provider<CalibrationEngine> calibrationEngineProvider;

  private final Provider<UnitConverter> unitConverterProvider;

  public AppModule_ProvideMeasurementEngineFactory(
      Provider<FootContourDetector> contourDetectorProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<UnitConverter> unitConverterProvider) {
    this.contourDetectorProvider = contourDetectorProvider;
    this.calibrationEngineProvider = calibrationEngineProvider;
    this.unitConverterProvider = unitConverterProvider;
  }

  @Override
  public MeasurementEngine get() {
    return provideMeasurementEngine(contourDetectorProvider.get(), calibrationEngineProvider.get(), unitConverterProvider.get());
  }

  public static AppModule_ProvideMeasurementEngineFactory create(
      Provider<FootContourDetector> contourDetectorProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<UnitConverter> unitConverterProvider) {
    return new AppModule_ProvideMeasurementEngineFactory(contourDetectorProvider, calibrationEngineProvider, unitConverterProvider);
  }

  public static MeasurementEngine provideMeasurementEngine(FootContourDetector contourDetector,
      CalibrationEngine calibrationEngine, UnitConverter unitConverter) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideMeasurementEngine(contourDetector, calibrationEngine, unitConverter));
  }
}
