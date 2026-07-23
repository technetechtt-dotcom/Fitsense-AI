package com.fitsense.ai.di;

import com.fitsense.ai.recommendation.RecommendationEngine;
import com.fitsense.ai.recommendation.ShoeCatalog;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class AppModule_ProvideRecommendationEngineFactory implements Factory<RecommendationEngine> {
  private final Provider<ShoeCatalog> catalogProvider;

  public AppModule_ProvideRecommendationEngineFactory(Provider<ShoeCatalog> catalogProvider) {
    this.catalogProvider = catalogProvider;
  }

  @Override
  public RecommendationEngine get() {
    return provideRecommendationEngine(catalogProvider.get());
  }

  public static AppModule_ProvideRecommendationEngineFactory create(
      Provider<ShoeCatalog> catalogProvider) {
    return new AppModule_ProvideRecommendationEngineFactory(catalogProvider);
  }

  public static RecommendationEngine provideRecommendationEngine(ShoeCatalog catalog) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideRecommendationEngine(catalog));
  }
}
