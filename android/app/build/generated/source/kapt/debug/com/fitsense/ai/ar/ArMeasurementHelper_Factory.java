package com.fitsense.ai.ar;

import com.fitsense.ai.measurement.CalibrationEngine;
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
public final class ArMeasurementHelper_Factory implements Factory<ArMeasurementHelper> {
  private final Provider<CalibrationEngine> calibrationEngineProvider;

  public ArMeasurementHelper_Factory(Provider<CalibrationEngine> calibrationEngineProvider) {
    this.calibrationEngineProvider = calibrationEngineProvider;
  }

  @Override
  public ArMeasurementHelper get() {
    return newInstance(calibrationEngineProvider.get());
  }

  public static ArMeasurementHelper_Factory create(
      Provider<CalibrationEngine> calibrationEngineProvider) {
    return new ArMeasurementHelper_Factory(calibrationEngineProvider);
  }

  public static ArMeasurementHelper newInstance(CalibrationEngine calibrationEngine) {
    return new ArMeasurementHelper(calibrationEngine);
  }
}
