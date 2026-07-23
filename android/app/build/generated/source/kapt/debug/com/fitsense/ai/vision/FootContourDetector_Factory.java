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
public final class FootContourDetector_Factory implements Factory<FootContourDetector> {
  private final Provider<ImagePreprocessor> preprocessorProvider;

  public FootContourDetector_Factory(Provider<ImagePreprocessor> preprocessorProvider) {
    this.preprocessorProvider = preprocessorProvider;
  }

  @Override
  public FootContourDetector get() {
    return newInstance(preprocessorProvider.get());
  }

  public static FootContourDetector_Factory create(
      Provider<ImagePreprocessor> preprocessorProvider) {
    return new FootContourDetector_Factory(preprocessorProvider);
  }

  public static FootContourDetector newInstance(ImagePreprocessor preprocessor) {
    return new FootContourDetector(preprocessor);
  }
}
