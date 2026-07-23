package com.fitsense.ai.sync;

import com.fitsense.ai.auth.DeviceAuthClient;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
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
public final class SyncClient_Factory implements Factory<SyncClient> {
  private final Provider<DeviceAuthClient> authClientProvider;

  public SyncClient_Factory(Provider<DeviceAuthClient> authClientProvider) {
    this.authClientProvider = authClientProvider;
  }

  @Override
  public SyncClient get() {
    return newInstance(authClientProvider.get());
  }

  public static SyncClient_Factory create(Provider<DeviceAuthClient> authClientProvider) {
    return new SyncClient_Factory(authClientProvider);
  }

  public static SyncClient newInstance(DeviceAuthClient authClient) {
    return new SyncClient(authClient);
  }
}
