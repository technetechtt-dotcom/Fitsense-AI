package com.fitsense.ai.vision;

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
public final class PerspectiveCorrection_Factory implements Factory<PerspectiveCorrection> {
  @Override
  public PerspectiveCorrection get() {
    return newInstance();
  }

  public static PerspectiveCorrection_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static PerspectiveCorrection newInstance() {
    return new PerspectiveCorrection();
  }

  private static final class InstanceHolder {
    private static final PerspectiveCorrection_Factory INSTANCE = new PerspectiveCorrection_Factory();
  }
}
