package com.fitsense.ai.viewmodel;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
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
public final class OnboardingViewModel_Factory implements Factory<OnboardingViewModel> {
  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public OnboardingViewModel_Factory(Provider<DataStore<Preferences>> dataStoreProvider) {
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public OnboardingViewModel get() {
    return newInstance(dataStoreProvider.get());
  }

  public static OnboardingViewModel_Factory create(
      Provider<DataStore<Preferences>> dataStoreProvider) {
    return new OnboardingViewModel_Factory(dataStoreProvider);
  }

  public static OnboardingViewModel newInstance(DataStore<Preferences> dataStore) {
    return new OnboardingViewModel(dataStore);
  }
}
