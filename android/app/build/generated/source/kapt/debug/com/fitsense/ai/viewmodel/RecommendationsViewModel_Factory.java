package com.fitsense.ai.viewmodel;

import androidx.lifecycle.SavedStateHandle;
import com.fitsense.ai.recommendation.RecommendationEngine;
import com.fitsense.ai.repository.ProductRepository;
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
public final class RecommendationsViewModel_Factory implements Factory<RecommendationsViewModel> {
  private final Provider<SavedStateHandle> savedStateHandleProvider;

  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<ScanRepository> scanRepositoryProvider;

  private final Provider<ProductRepository> productRepositoryProvider;

  private final Provider<RecommendationEngine> recommendationEngineProvider;

  public RecommendationsViewModel_Factory(Provider<SavedStateHandle> savedStateHandleProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<ProductRepository> productRepositoryProvider,
      Provider<RecommendationEngine> recommendationEngineProvider) {
    this.savedStateHandleProvider = savedStateHandleProvider;
    this.userRepositoryProvider = userRepositoryProvider;
    this.scanRepositoryProvider = scanRepositoryProvider;
    this.productRepositoryProvider = productRepositoryProvider;
    this.recommendationEngineProvider = recommendationEngineProvider;
  }

  @Override
  public RecommendationsViewModel get() {
    return newInstance(savedStateHandleProvider.get(), userRepositoryProvider.get(), scanRepositoryProvider.get(), productRepositoryProvider.get(), recommendationEngineProvider.get());
  }

  public static RecommendationsViewModel_Factory create(
      Provider<SavedStateHandle> savedStateHandleProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<ProductRepository> productRepositoryProvider,
      Provider<RecommendationEngine> recommendationEngineProvider) {
    return new RecommendationsViewModel_Factory(savedStateHandleProvider, userRepositoryProvider, scanRepositoryProvider, productRepositoryProvider, recommendationEngineProvider);
  }

  public static RecommendationsViewModel newInstance(SavedStateHandle savedStateHandle,
      UserRepository userRepository, ScanRepository scanRepository,
      ProductRepository productRepository, RecommendationEngine recommendationEngine) {
    return new RecommendationsViewModel(savedStateHandle, userRepository, scanRepository, productRepository, recommendationEngine);
  }
}
