package com.fitsense.ai.di;

import com.fitsense.ai.measurement.CalibrationEngine;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class AppModule_ProvideCalibrationEngineFactory implements Factory<CalibrationEngine> {
  @Override
  public CalibrationEngine get() {
    return provideCalibrationEngine();
  }

  public static AppModule_ProvideCalibrationEngineFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CalibrationEngine provideCalibrationEngine() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideCalibrationEngine());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvideCalibrationEngineFactory INSTANCE = new AppModule_ProvideCalibrationEngineFactory();
  }
}
