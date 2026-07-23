package com.fitsense.ai.vision;

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
public final class ReferenceDetector_Factory implements Factory<ReferenceDetector> {
  private final Provider<ImagePreprocessor> preprocessorProvider;

  public ReferenceDetector_Factory(Provider<ImagePreprocessor> preprocessorProvider) {
    this.preprocessorProvider = preprocessorProvider;
  }

  @Override
  public ReferenceDetector get() {
    return newInstance(preprocessorProvider.get());
  }

  public static ReferenceDetector_Factory create(Provider<ImagePreprocessor> preprocessorProvider) {
    return new ReferenceDetector_Factory(preprocessorProvider);
  }

  public static ReferenceDetector newInstance(ImagePreprocessor preprocessor) {
    return new ReferenceDetector(preprocessor);
  }
}
