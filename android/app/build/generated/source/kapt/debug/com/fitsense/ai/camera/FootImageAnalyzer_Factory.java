package com.fitsense.ai.camera;

import com.fitsense.ai.vision.FootContourDetector;
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
public final class FootImageAnalyzer_Factory implements Factory<FootImageAnalyzer> {
  private final Provider<FootContourDetector> contourDetectorProvider;

  public FootImageAnalyzer_Factory(Provider<FootContourDetector> contourDetectorProvider) {
    this.contourDetectorProvider = contourDetectorProvider;
  }

  @Override
  public FootImageAnalyzer get() {
    return newInstance(contourDetectorProvider.get());
  }

  public static FootImageAnalyzer_Factory create(
      Provider<FootContourDetector> contourDetectorProvider) {
    return new FootImageAnalyzer_Factory(contourDetectorProvider);
  }

  public static FootImageAnalyzer newInstance(FootContourDetector contourDetector) {
    return new FootImageAnalyzer(contourDetector);
  }
}
