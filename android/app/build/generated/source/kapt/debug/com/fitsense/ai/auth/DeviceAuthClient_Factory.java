package com.fitsense.ai.auth;

import com.fitsense.ai.local.SecureDeviceCredentialStore;
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
public final class DeviceAuthClient_Factory implements Factory<DeviceAuthClient> {
  private final Provider<SecureDeviceCredentialStore> credentialStoreProvider;

  public DeviceAuthClient_Factory(Provider<SecureDeviceCredentialStore> credentialStoreProvider) {
    this.credentialStoreProvider = credentialStoreProvider;
  }

  @Override
  public DeviceAuthClient get() {
    return newInstance(credentialStoreProvider.get());
  }

  public static DeviceAuthClient_Factory create(
      Provider<SecureDeviceCredentialStore> credentialStoreProvider) {
    return new DeviceAuthClient_Factory(credentialStoreProvider);
  }

  public static DeviceAuthClient newInstance(SecureDeviceCredentialStore credentialStore) {
    return new DeviceAuthClient(credentialStore);
  }
}
