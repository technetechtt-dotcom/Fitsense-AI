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
public final class UnitConverter_Factory implements Factory<UnitConverter> {
  @Override
  public UnitConverter get() {
    return newInstance();
  }

  public static UnitConverter_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static UnitConverter newInstance() {
    return new UnitConverter();
  }

  private static final class InstanceHolder {
    private static final UnitConverter_Factory INSTANCE = new UnitConverter_Factory();
  }
}
