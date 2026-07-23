package com.fitsense.ai.di;

import com.fitsense.ai.vision.OpenCvInitializer;
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
public final class AppModule_ProvideOpenCvInitializerFactory implements Factory<OpenCvInitializer> {
  @Override
  public OpenCvInitializer get() {
    return provideOpenCvInitializer();
  }

  public static AppModule_ProvideOpenCvInitializerFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static OpenCvInitializer provideOpenCvInitializer() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideOpenCvInitializer());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvideOpenCvInitializerFactory INSTANCE = new AppModule_ProvideOpenCvInitializerFactory();
  }
}
