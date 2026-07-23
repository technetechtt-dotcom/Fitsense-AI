package com.fitsense.ai.repository;

import com.fitsense.ai.local.DeviceIdentityService;
import com.fitsense.ai.local.LocalUserStore;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class UserRepositoryImpl_Factory implements Factory<UserRepositoryImpl> {
  private final Provider<DeviceIdentityService> identityServiceProvider;

  private final Provider<LocalUserStore> userStoreProvider;

  public UserRepositoryImpl_Factory(Provider<DeviceIdentityService> identityServiceProvider,
      Provider<LocalUserStore> userStoreProvider) {
    this.identityServiceProvider = identityServiceProvider;
    this.userStoreProvider = userStoreProvider;
  }

  @Override
  public UserRepositoryImpl get() {
    return newInstance(identityServiceProvider.get(), userStoreProvider.get());
  }

  public static UserRepositoryImpl_Factory create(
      Provider<DeviceIdentityService> identityServiceProvider,
      Provider<LocalUserStore> userStoreProvider) {
    return new UserRepositoryImpl_Factory(identityServiceProvider, userStoreProvider);
  }

  public static UserRepositoryImpl newInstance(DeviceIdentityService identityService,
      LocalUserStore userStore) {
    return new UserRepositoryImpl(identityService, userStore);
  }
}
