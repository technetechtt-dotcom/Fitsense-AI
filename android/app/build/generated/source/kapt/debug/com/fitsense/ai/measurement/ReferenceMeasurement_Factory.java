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
public final class ReferenceMeasurement_Factory implements Factory<ReferenceMeasurement> {
  @Override
  public ReferenceMeasurement get() {
    return newInstance();
  }

  public static ReferenceMeasurement_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ReferenceMeasurement newInstance() {
    return new ReferenceMeasurement();
  }

  private static final class InstanceHolder {
    private static final ReferenceMeasurement_Factory INSTANCE = new ReferenceMeasurement_Factory();
  }
}
