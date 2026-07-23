package com.fitsense.ai.repository;

import com.fitsense.ai.recommendation.ShoeCatalog;
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
public final class ProductRepositoryImpl_Factory implements Factory<ProductRepositoryImpl> {
  private final Provider<ShoeCatalog> catalogProvider;

  public ProductRepositoryImpl_Factory(Provider<ShoeCatalog> catalogProvider) {
    this.catalogProvider = catalogProvider;
  }

  @Override
  public ProductRepositoryImpl get() {
    return newInstance(catalogProvider.get());
  }

  public static ProductRepositoryImpl_Factory create(Provider<ShoeCatalog> catalogProvider) {
    return new ProductRepositoryImpl_Factory(catalogProvider);
  }

  public static ProductRepositoryImpl newInstance(ShoeCatalog catalog) {
    return new ProductRepositoryImpl(catalog);
  }
}
