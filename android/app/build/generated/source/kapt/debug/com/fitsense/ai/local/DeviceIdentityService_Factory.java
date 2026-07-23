package com.fitsense.ai.local;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
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
public final class DeviceIdentityService_Factory implements Factory<DeviceIdentityService> {
  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public DeviceIdentityService_Factory(Provider<DataStore<Preferences>> dataStoreProvider) {
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public DeviceIdentityService get() {
    return newInstance(dataStoreProvider.get());
  }

  public static DeviceIdentityService_Factory create(
      Provider<DataStore<Preferences>> dataStoreProvider) {
    return new DeviceIdentityService_Factory(dataStoreProvider);
  }

  public static DeviceIdentityService newInstance(DataStore<Preferences> dataStore) {
    return new DeviceIdentityService(dataStore);
  }
}
