package com.fitsense.ai.identity;

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
public final class FitIdentityClient_Factory implements Factory<FitIdentityClient> {
  private final Provider<DeviceAuthClient> authClientProvider;

  public FitIdentityClient_Factory(Provider<DeviceAuthClient> authClientProvider) {
    this.authClientProvider = authClientProvider;
  }

  @Override
  public FitIdentityClient get() {
    return newInstance(authClientProvider.get());
  }

  public static FitIdentityClient_Factory create(Provider<DeviceAuthClient> authClientProvider) {
    return new FitIdentityClient_Factory(authClientProvider);
  }

  public static FitIdentityClient newInstance(DeviceAuthClient authClient) {
    return new FitIdentityClient(authClient);
  }
}
