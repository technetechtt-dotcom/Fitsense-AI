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
public final class MeasurementValidator_Factory implements Factory<MeasurementValidator> {
  @Override
  public MeasurementValidator get() {
    return newInstance();
  }

  public static MeasurementValidator_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static MeasurementValidator newInstance() {
    return new MeasurementValidator();
  }

  private static final class InstanceHolder {
    private static final MeasurementValidator_Factory INSTANCE = new MeasurementValidator_Factory();
  }
}
