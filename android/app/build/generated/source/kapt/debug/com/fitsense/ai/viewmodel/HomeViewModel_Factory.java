package com.fitsense.ai.viewmodel;

import com.fitsense.ai.repository.ScanRepository;
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
public final class HomeViewModel_Factory implements Factory<HomeViewModel> {
  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<ScanRepository> scanRepositoryProvider;

  public HomeViewModel_Factory(Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider) {
    this.userRepositoryProvider = userRepositoryProvider;
    this.scanRepositoryProvider = scanRepositoryProvider;
  }

  @Override
  public HomeViewModel get() {
    return newInstance(userRepositoryProvider.get(), scanRepositoryProvider.get());
  }

  public static HomeViewModel_Factory create(Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider) {
    return new HomeViewModel_Factory(userRepositoryProvider, scanRepositoryProvider);
  }

  public static HomeViewModel newInstance(UserRepository userRepository,
      ScanRepository scanRepository) {
    return new HomeViewModel(userRepository, scanRepository);
  }
}
