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
public final class LocalUserStore_Factory implements Factory<LocalUserStore> {
  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public LocalUserStore_Factory(Provider<DataStore<Preferences>> dataStoreProvider) {
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public LocalUserStore get() {
    return newInstance(dataStoreProvider.get());
  }

  public static LocalUserStore_Factory create(Provider<DataStore<Preferences>> dataStoreProvider) {
    return new LocalUserStore_Factory(dataStoreProvider);
  }

  public static LocalUserStore newInstance(DataStore<Preferences> dataStore) {
    return new LocalUserStore(dataStore);
  }
}
