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
public final class ImagePreprocessor_Factory implements Factory<ImagePreprocessor> {
  @Override
  public ImagePreprocessor get() {
    return newInstance();
  }

  public static ImagePreprocessor_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ImagePreprocessor newInstance() {
    return new ImagePreprocessor();
  }

  private static final class InstanceHolder {
    private static final ImagePreprocessor_Factory INSTANCE = new ImagePreprocessor_Factory();
  }
}
