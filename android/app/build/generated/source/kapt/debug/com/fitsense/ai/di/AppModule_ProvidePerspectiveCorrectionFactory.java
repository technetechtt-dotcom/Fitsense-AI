package com.fitsense.ai.di;

import com.fitsense.ai.vision.PerspectiveCorrection;
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
public final class AppModule_ProvidePerspectiveCorrectionFactory implements Factory<PerspectiveCorrection> {
  @Override
  public PerspectiveCorrection get() {
    return providePerspectiveCorrection();
  }

  public static AppModule_ProvidePerspectiveCorrectionFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static PerspectiveCorrection providePerspectiveCorrection() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.providePerspectiveCorrection());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvidePerspectiveCorrectionFactory INSTANCE = new AppModule_ProvidePerspectiveCorrectionFactory();
  }
}
