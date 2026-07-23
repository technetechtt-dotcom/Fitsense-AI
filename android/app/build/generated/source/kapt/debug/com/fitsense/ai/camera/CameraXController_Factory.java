package com.fitsense.ai.camera;

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
public final class CameraXController_Factory implements Factory<CameraXController> {
  @Override
  public CameraXController get() {
    return newInstance();
  }

  public static CameraXController_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CameraXController newInstance() {
    return new CameraXController();
  }

  private static final class InstanceHolder {
    private static final CameraXController_Factory INSTANCE = new CameraXController_Factory();
  }
}
