package com.fitsense.ai.viewmodel;

import androidx.lifecycle.SavedStateHandle;
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
public final class ResultsViewModel_Factory implements Factory<ResultsViewModel> {
  private final Provider<SavedStateHandle> savedStateHandleProvider;

  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<ScanRepository> scanRepositoryProvider;

  public ResultsViewModel_Factory(Provider<SavedStateHandle> savedStateHandleProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider) {
    this.savedStateHandleProvider = savedStateHandleProvider;
    this.userRepositoryProvider = userRepositoryProvider;
    this.scanRepositoryProvider = scanRepositoryProvider;
  }

  @Override
  public ResultsViewModel get() {
    return newInstance(savedStateHandleProvider.get(), userRepositoryProvider.get(), scanRepositoryProvider.get());
  }

  public static ResultsViewModel_Factory create(Provider<SavedStateHandle> savedStateHandleProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider) {
    return new ResultsViewModel_Factory(savedStateHandleProvider, userRepositoryProvider, scanRepositoryProvider);
  }

  public static ResultsViewModel newInstance(SavedStateHandle savedStateHandle,
      UserRepository userRepository, ScanRepository scanRepository) {
    return new ResultsViewModel(savedStateHandle, userRepository, scanRepository);
  }
}
