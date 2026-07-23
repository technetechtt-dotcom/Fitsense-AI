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
public final class ImageQualityProbe_Factory implements Factory<ImageQualityProbe> {
  @Override
  public ImageQualityProbe get() {
    return newInstance();
  }

  public static ImageQualityProbe_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ImageQualityProbe newInstance() {
    return new ImageQualityProbe();
  }

  private static final class InstanceHolder {
    private static final ImageQualityProbe_Factory INSTANCE = new ImageQualityProbe_Factory();
  }
}
