package com.fitsense.ai.di;

import com.fitsense.ai.recommendation.ShoeCatalog;
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
public final class AppModule_ProvideShoeCatalogFactory implements Factory<ShoeCatalog> {
  @Override
  public ShoeCatalog get() {
    return provideShoeCatalog();
  }

  public static AppModule_ProvideShoeCatalogFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ShoeCatalog provideShoeCatalog() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideShoeCatalog());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvideShoeCatalogFactory INSTANCE = new AppModule_ProvideShoeCatalogFactory();
  }
}
