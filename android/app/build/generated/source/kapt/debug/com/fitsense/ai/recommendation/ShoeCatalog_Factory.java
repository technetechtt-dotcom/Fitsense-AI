package com.fitsense.ai.recommendation;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
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
public final class ShoeCatalog_Factory implements Factory<ShoeCatalog> {
  @Override
  public ShoeCatalog get() {
    return newInstance();
  }

  public static ShoeCatalog_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ShoeCatalog newInstance() {
    return new ShoeCatalog();
  }

  private static final class InstanceHolder {
    private static final ShoeCatalog_Factory INSTANCE = new ShoeCatalog_Factory();
  }
}
