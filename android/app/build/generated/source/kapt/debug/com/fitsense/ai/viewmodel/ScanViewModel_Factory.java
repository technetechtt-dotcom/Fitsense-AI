package com.fitsense.ai.viewmodel;

import com.fitsense.ai.accuracy.AccuracyDatasetStore;
import com.fitsense.ai.camera.CameraXController;
import com.fitsense.ai.measurement.CalibrationEngine;
import com.fitsense.ai.measurement.MeasurementEngine;
import com.fitsense.ai.measurement.MeasurementValidator;
import com.fitsense.ai.measurement.ReferenceMeasurement;
import com.fitsense.ai.recommendation.RecommendationEngine;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.sync.CloudSyncCoordinator;
import com.fitsense.ai.vision.ImageOrientation;
import com.fitsense.ai.vision.ImageQualityProbe;
import com.fitsense.ai.vision.LandmarkBootstrap;
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
public final class ScanViewModel_Factory implements Factory<ScanViewModel> {
  private final Provider<CameraXController> cameraControllerProvider;

  private final Provider<ImageOrientation> imageOrientationProvider;

  private final Provider<ImageQualityProbe> imageQualityProbeProvider;

  private final Provider<LandmarkBootstrap> landmarkBootstrapProvider;

  private final Provider<ReferenceMeasurement> referenceMeasurementProvider;

  private final Provider<CalibrationEngine> calibrationEngineProvider;

  private final Provider<MeasurementEngine> measurementEngineProvider;

  private final Provider<MeasurementValidator> measurementValidatorProvider;

  private final Provider<ScanRepository> scanRepositoryProvider;

  private final Provider<UserRepository> userRepositoryProvider;

  private final Provider<RecommendationEngine> recommendationEngineProvider;

  private final Provider<AccuracyDatasetStore> accuracyDatasetStoreProvider;

  private final Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider;

  public ScanViewModel_Factory(Provider<CameraXController> cameraControllerProvider,
      Provider<ImageOrientation> imageOrientationProvider,
      Provider<ImageQualityProbe> imageQualityProbeProvider,
      Provider<LandmarkBootstrap> landmarkBootstrapProvider,
      Provider<ReferenceMeasurement> referenceMeasurementProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<MeasurementEngine> measurementEngineProvider,
      Provider<MeasurementValidator> measurementValidatorProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<RecommendationEngine> recommendationEngineProvider,
      Provider<AccuracyDatasetStore> accuracyDatasetStoreProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    this.cameraControllerProvider = cameraControllerProvider;
    this.imageOrientationProvider = imageOrientationProvider;
    this.imageQualityProbeProvider = imageQualityProbeProvider;
    this.landmarkBootstrapProvider = landmarkBootstrapProvider;
    this.referenceMeasurementProvider = referenceMeasurementProvider;
    this.calibrationEngineProvider = calibrationEngineProvider;
    this.measurementEngineProvider = measurementEngineProvider;
    this.measurementValidatorProvider = measurementValidatorProvider;
    this.scanRepositoryProvider = scanRepositoryProvider;
    this.userRepositoryProvider = userRepositoryProvider;
    this.recommendationEngineProvider = recommendationEngineProvider;
    this.accuracyDatasetStoreProvider = accuracyDatasetStoreProvider;
    this.cloudSyncCoordinatorProvider = cloudSyncCoordinatorProvider;
  }

  @Override
  public ScanViewModel get() {
    return newInstance(cameraControllerProvider.get(), imageOrientationProvider.get(), imageQualityProbeProvider.get(), landmarkBootstrapProvider.get(), referenceMeasurementProvider.get(), calibrationEngineProvider.get(), measurementEngineProvider.get(), measurementValidatorProvider.get(), scanRepositoryProvider.get(), userRepositoryProvider.get(), recommendationEngineProvider.get(), accuracyDatasetStoreProvider.get(), cloudSyncCoordinatorProvider.get());
  }

  public static ScanViewModel_Factory create(Provider<CameraXController> cameraControllerProvider,
      Provider<ImageOrientation> imageOrientationProvider,
      Provider<ImageQualityProbe> imageQualityProbeProvider,
      Provider<LandmarkBootstrap> landmarkBootstrapProvider,
      Provider<ReferenceMeasurement> referenceMeasurementProvider,
      Provider<CalibrationEngine> calibrationEngineProvider,
      Provider<MeasurementEngine> measurementEngineProvider,
      Provider<MeasurementValidator> measurementValidatorProvider,
      Provider<ScanRepository> scanRepositoryProvider,
      Provider<UserRepository> userRepositoryProvider,
      Provider<RecommendationEngine> recommendationEngineProvider,
      Provider<AccuracyDatasetStore> accuracyDatasetStoreProvider,
      Provider<CloudSyncCoordinator> cloudSyncCoordinatorProvider) {
    return new ScanViewModel_Factory(cameraControllerProvider, imageOrientationProvider, imageQualityProbeProvider, landmarkBootstrapProvider, referenceMeasurementProvider, calibrationEngineProvider, measurementEngineProvider, measurementValidatorProvider, scanRepositoryProvider, userRepositoryProvider, recommendationEngineProvider, accuracyDatasetStoreProvider, cloudSyncCoordinatorProvider);
  }

  public static ScanViewModel newInstance(CameraXController cameraController,
      ImageOrientation imageOrientation, ImageQualityProbe imageQualityProbe,
      LandmarkBootstrap landmarkBootstrap, ReferenceMeasurement referenceMeasurement,
      CalibrationEngine calibrationEngine, MeasurementEngine measurementEngine,
      MeasurementValidator measurementValidator, ScanRepository scanRepository,
      UserRepository userRepository, RecommendationEngine recommendationEngine,
      AccuracyDatasetStore accuracyDatasetStore, CloudSyncCoordinator cloudSyncCoordinator) {
    return new ScanViewModel(cameraController, imageOrientation, imageQualityProbe, landmarkBootstrap, referenceMeasurement, calibrationEngine, measurementEngine, measurementValidator, scanRepository, userRepository, recommendationEngine, accuracyDatasetStore, cloudSyncCoordinator);
  }
}
