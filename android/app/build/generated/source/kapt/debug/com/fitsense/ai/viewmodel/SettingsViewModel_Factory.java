package com.fitsense.ai.viewmodel;

import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.sync.CloudSyncCoordinator;
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
public final class SettingsViewModel_Factory implements Factory<SettingsViewModel> {
  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider;

  public SettingsViewModel_Factory(Provider<UserRepository> userRepositoryProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    this.userRepositoryProvider = userRepositoryProvider;
    this.cloudSyncCoordinatorProvider = cloudSyncCoordinatorProvider;
  }

  @Override
  public SettingsViewModel get() {
    return newInstance(userRepositoryProvider.get(), cloudSyncCoordinatorProvider.get());
  }

  public static SettingsViewModel_Factory create(Provider<UserRepository> userRepositoryProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    return new SettingsViewModel_Factory(userRepositoryProvider, cloudSyncCoordinatorProvider);
  }

  public static SettingsViewModel newInstance(UserRepository userRepository,
      CloudSyncCoordinator cloudSyncCoordinator) {
    return new SettingsViewModel(userRepository, cloudSyncCoordinator);
  }
}
