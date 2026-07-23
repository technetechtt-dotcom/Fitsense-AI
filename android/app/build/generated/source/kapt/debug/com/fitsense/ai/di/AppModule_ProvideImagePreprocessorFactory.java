package com.fitsense.ai.di;

import com.fitsense.ai.vision.ImagePreprocessor;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class AppModule_ProvideImagePreprocessorFactory implements Factory<ImagePreprocessor> {
  @Override
  public ImagePreprocessor get() {
    return provideImagePreprocessor();
  }

  public static AppModule_ProvideImagePreprocessorFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ImagePreprocessor provideImagePreprocessor() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideImagePreprocessor());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvideImagePreprocessorFactory INSTANCE = new AppModule_ProvideImagePreprocessorFactory();
  }
}
