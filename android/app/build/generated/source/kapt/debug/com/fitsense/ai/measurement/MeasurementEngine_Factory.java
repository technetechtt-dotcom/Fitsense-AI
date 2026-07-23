package com.fitsense.ai.measurement;

import com.fitsense.ai.vision.FootContourDetector;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class MeasurementEngine_Factory implements Factory<MeasurementEngine> {
  private final Provider<FootContourDetector> contourDetectorProvider;

  private final Provider<CalibrationEngine> calibrationEngineProvider;

  private final Provider<UnitConverter> unitConverterProvider;

  public MeasurementEngine_Factory(Provider<FootContourDetector> contourDetectorProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<UnitConverter> unitConverterProvider) {
    this.contourDetectorProvider = contourDetectorProvider;
    this.calibrationEngineProvider = calibrationEngineProvider;
    this.unitConverterProvider = unitConverterProvider;
  }

  @Override
  public MeasurementEngine get() {
    return newInstance(contourDetectorProvider.get(), calibrationEngineProvider.get(), unitConverterProvider.get());
  }

  public static MeasurementEngine_Factory create(
      Provider<FootContourDetector> contourDetectorProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<UnitConverter> unitConverterProvider) {
    return new MeasurementEngine_Factory(contourDetectorProvider, calibrationEngineProvider, unitConverterProvider);
  }

  public static MeasurementEngine newInstance(FootContourDetector contourDetector,
      CalibrationEngine calibrationEngine, UnitConverter unitConverter) {
    return new MeasurementEngine(contourDetector, calibrationEngine, unitConverter);
  }
}
