package com.fitsense.ai.handoff;

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
public final class HandoffClient_Factory implements Factory<HandoffClient> {
  @Override
  public HandoffClient get() {
    return newInstance();
  }

  public static HandoffClient_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static HandoffClient newInstance() {
    return new HandoffClient();
  }

  private static final class InstanceHolder {
    private static final HandoffClient_Factory INSTANCE = new HandoffClient_Factory();
  }
}
