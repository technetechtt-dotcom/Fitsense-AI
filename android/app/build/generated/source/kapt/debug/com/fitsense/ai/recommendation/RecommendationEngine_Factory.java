package com.fitsense.ai.recommendation;

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
public final class RecommendationEngine_Factory implements Factory<RecommendationEngine> {
  private final Provider<ShoeCatalog> catalogProvider;

  public RecommendationEngine_Factory(Provider<ShoeCatalog> catalogProvider) {
    this.catalogProvider = catalogProvider;
  }

  @Override
  public RecommendationEngine get() {
    return newInstance(catalogProvider.get());
  }

  public static RecommendationEngine_Factory create(Provider<ShoeCatalog> catalogProvider) {
    return new RecommendationEngine_Factory(catalogProvider);
  }

  public static RecommendationEngine newInstance(ShoeCatalog catalog) {
    return new RecommendationEngine(catalog);
  }
}
