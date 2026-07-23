package com.fitsense.ai.viewmodel;

import com.fitsense.ai.repository.ScanRepository;
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
public final class MeasurementsViewModel_Factory implements Factory<MeasurementsViewModel> {
  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<ScanRepository> scanRepositoryProvider;

  private final Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider;

  public MeasurementsViewModel_Factory(Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    this.userRepositoryProvider = userRepositoryProvider;
    this.scanRepositoryProvider = scanRepositoryProvider;
    this.cloudSyncCoordinatorProvider = cloudSyncCoordinatorProvider;
  }

  @Override
  public MeasurementsViewModel get() {
    return newInstance(userRepositoryProvider.get(), scanRepositoryProvider.get(), cloudSyncCoordinatorProvider.get());
  }

  public static MeasurementsViewModel_Factory create(
      Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    return new MeasurementsViewModel_Factory(userRepositoryProvider, scanRepositoryProvider, cloudSyncCoordinatorProvider);
  }

  public static MeasurementsViewModel newInstance(UserRepository userRepository,
      ScanRepository scanRepository, CloudSyncCoordinator cloudSyncCoordinator) {
    return new MeasurementsViewModel(userRepository, scanRepository, cloudSyncCoordinator);
  }
}
