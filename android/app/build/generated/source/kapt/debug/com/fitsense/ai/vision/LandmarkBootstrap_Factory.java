package com.fitsense.ai.vision;

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
public final class LandmarkBootstrap_Factory implements Factory<LandmarkBootstrap> {
  private final Provider<ReferenceDetector> referenceDetectorProvider;

  private final Provider<FootContourDetector> contourDetectorProvider;

  public LandmarkBootstrap_Factory(Provider<ReferenceDetector> referenceDetectorProvider,
      Provider<FootContourDetector> contourDetectorProvider) {
    this.referenceDetectorProvider = referenceDetectorProvider;
    this.contourDetectorProvider = contourDetectorProvider;
  }

  @Override
  public LandmarkBootstrap get() {
    return newInstance(referenceDetectorProvider.get(), contourDetectorProvider.get());
  }

  public static LandmarkBootstrap_Factory create(
      Provider<ReferenceDetector> referenceDetectorProvider,
      Provider<FootContourDetector> contourDetectorProvider) {
    return new LandmarkBootstrap_Factory(referenceDetectorProvider, contourDetectorProvider);
  }

  public static LandmarkBootstrap newInstance(ReferenceDetector referenceDetector,
      FootContourDetector contourDetector) {
    return new LandmarkBootstrap(referenceDetector, contourDetector);
  }
}
