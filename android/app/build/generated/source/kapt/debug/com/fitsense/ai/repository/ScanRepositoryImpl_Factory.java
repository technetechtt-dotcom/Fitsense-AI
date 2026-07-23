package com.fitsense.ai.repository;

import com.fitsense.ai.local.LocalScanStore;
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
public final class ScanRepositoryImpl_Factory implements Factory<ScanRepositoryImpl> {
  private final Provider<LocalScanStore> scanStoreProvider;

  public ScanRepositoryImpl_Factory(Provider<LocalScanStore> scanStoreProvider) {
    this.scanStoreProvider = scanStoreProvider;
  }

  @Override
  public ScanRepositoryImpl get() {
    return newInstance(scanStoreProvider.get());
  }

  public static ScanRepositoryImpl_Factory create(Provider<LocalScanStore> scanStoreProvider) {
    return new ScanRepositoryImpl_Factory(scanStoreProvider);
  }

  public static ScanRepositoryImpl newInstance(LocalScanStore scanStore) {
    return new ScanRepositoryImpl(scanStore);
  }
}
