package com.fitsense.ai.sync;

import com.fitsense.ai.auth.DeviceAuthClient;
import com.fitsense.ai.local.LocalScanStore;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
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
public final class CloudSyncCoordinator_Factory implements Factory<CloudSyncCoordinator> {
  private final Provider<DeviceAuthClient> authClientProvider;

  private final Provider<SyncClient> syncClientProvider;

  private final Provider<SyncOutboxStore> outboxProvider;

  private final Provider<LocalScanStore> scanStoreProvider;

  public CloudSyncCoordinator_Factory(Provider<DeviceAuthClient> authClientProvider,
      Provider<SyncClient> syncClientProvider, Provider<SyncOutboxStore> outboxProvider,
      Provider<LocalScanStore> scanStoreProvider) {
    this.authClientProvider = authClientProvider;
    this.syncClientProvider = syncClientProvider;
    this.outboxProvider = outboxProvider;
    this.scanStoreProvider = scanStoreProvider;
  }

  @Override
  public CloudSyncCoordinator get() {
    return newInstance(authClientProvider.get(), syncClientProvider.get(), outboxProvider.get(), scanStoreProvider.get());
  }

  public static CloudSyncCoordinator_Factory create(Provider<DeviceAuthClient> authClientProvider,
      Provider<SyncClient> syncClientProvider, Provider<SyncOutboxStore> outboxProvider,
      Provider<LocalScanStore> scanStoreProvider) {
    return new CloudSyncCoordinator_Factory(authClientProvider, syncClientProvider, outboxProvider, scanStoreProvider);
  }

  public static CloudSyncCoordinator newInstance(DeviceAuthClient authClient, SyncClient syncClient,
      SyncOutboxStore outbox, LocalScanStore scanStore) {
    return new CloudSyncCoordinator(authClient, syncClient, outbox, scanStore);
  }
}
