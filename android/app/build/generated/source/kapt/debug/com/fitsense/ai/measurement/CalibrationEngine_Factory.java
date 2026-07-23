package com.fitsense.ai.measurement;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class CalibrationEngine_Factory implements Factory<CalibrationEngine> {
  @Override
  public CalibrationEngine get() {
    return newInstance();
  }

  public static CalibrationEngine_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CalibrationEngine newInstance() {
    return new CalibrationEngine();
  }

  private static final class InstanceHolder {
    private static final CalibrationEngine_Factory INSTANCE = new CalibrationEngine_Factory();
  }
}
