package com.fitsense.ai.di;

import com.fitsense.ai.vision.FootContourDetector;
import com.fitsense.ai.vision.ImagePreprocessor;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
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
public final class AppModule_ProvideFootContourDetectorFactory implements Factory<FootContourDetector> {
  private final Provider<ImagePreprocessor> preprocessorProvider;

  public AppModule_ProvideFootContourDetectorFactory(
      Provider<ImagePreprocessor> preprocessorProvider) {
    this.preprocessorProvider = preprocessorProvider;
  }

  @Override
  public FootContourDetector get() {
    return provideFootContourDetector(preprocessorProvider.get());
  }

  public static AppModule_ProvideFootContourDetectorFactory create(
      Provider<ImagePreprocessor> preprocessorProvider) {
    return new AppModule_ProvideFootContourDetectorFactory(preprocessorProvider);
  }

  public static FootContourDetector provideFootContourDetector(ImagePreprocessor preprocessor) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideFootContourDetector(preprocessor));
  }
}
