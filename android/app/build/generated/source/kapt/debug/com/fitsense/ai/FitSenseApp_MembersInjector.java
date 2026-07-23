package com.fitsense.ai;

import com.fitsense.ai.sync.CloudSyncCoordinator;
import com.fitsense.ai.vision.OpenCvInitializer;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

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
public final class FitSenseApp_MembersInjector implements MembersInjector<FitSenseApp> {
  private final Provider<OpenCvInitializer> openCvInitializerProvider;

  private final Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider;

  public FitSenseApp_MembersInjector(Provider<OpenCvInitializer> openCvInitializerProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    this.openCvInitializerProvider = openCvInitializerProvider;
    this.cloudSyncCoordinatorProvider = cloudSyncCoordinatorProvider;
  }

  public static MembersInjector<FitSenseApp> create(
      Provider<OpenCvInitializer> openCvInitializerProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    return new FitSenseApp_MembersInjector(openCvInitializerProvider, cloudSyncCoordinatorProvider);
  }

  @Override
  public void injectMembers(FitSenseApp instance) {
    injectOpenCvInitializer(instance, openCvInitializerProvider.get());
    injectCloudSyncCoordinator(instance, cloudSyncCoordinatorProvider.get());
  }

  @InjectedFieldSignature("com.fitsense.ai.FitSenseApp.openCvInitializer")
  public static void injectOpenCvInitializer(FitSenseApp instance,
      OpenCvInitializer openCvInitializer) {
    instance.openCvInitializer = openCvInitializer;
  }

  @InjectedFieldSignature("com.fitsense.ai.FitSenseApp.cloudSyncCoordinator")
  public static void injectCloudSyncCoordinator(FitSenseApp instance,
      CloudSyncCoordinator cloudSyncCoordinator) {
    instance.cloudSyncCoordinator = cloudSyncCoordinator;
  }
}
