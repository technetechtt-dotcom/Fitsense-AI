package com.fitsense.ai.viewmodel;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
import com.fitsense.ai.repository.UserRepository;
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
public final class SplashViewModel_Factory implements Factory<SplashViewModel> {
  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public SplashViewModel_Factory(Provider<UserRepository> userRepositoryProvider,
      Provider<DataStore<Preferences>> dataStoreProvider) {
    this.userRepositoryProvider = userRepositoryProvider;
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public SplashViewModel get() {
    return newInstance(userRepositoryProvider.get(), dataStoreProvider.get());
  }

  public static SplashViewModel_Factory create(Provider<UserRepository> userRepositoryProvider,
      Provider<DataStore<Preferences>> dataStoreProvider) {
    return new SplashViewModel_Factory(userRepositoryProvider, dataStoreProvider);
  }

  public static SplashViewModel newInstance(UserRepository userRepository,
      DataStore<Preferences> dataStore) {
    return new SplashViewModel(userRepository, dataStore);
  }
}
