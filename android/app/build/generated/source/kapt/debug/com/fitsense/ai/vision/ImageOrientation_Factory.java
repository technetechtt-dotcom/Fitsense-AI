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
public final class ImageOrientation_Factory implements Factory<ImageOrientation> {
  @Override
  public ImageOrientation get() {
    return newInstance();
  }

  public static ImageOrientation_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ImageOrientation newInstance() {
    return new ImageOrientation();
  }

  private static final class InstanceHolder {
    private static final ImageOrientation_Factory INSTANCE = new ImageOrientation_Factory();
  }
}
