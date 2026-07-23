package com.fitsense.ai.ar;

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
public final class ArCoreSessionManager_Factory implements Factory<ArCoreSessionManager> {
  @Override
  public ArCoreSessionManager get() {
    return newInstance();
  }

  public static ArCoreSessionManager_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static ArCoreSessionManager newInstance() {
    return new ArCoreSessionManager();
  }

  private static final class InstanceHolder {
    private static final ArCoreSessionManager_Factory INSTANCE = new ArCoreSessionManager_Factory();
  }
}
