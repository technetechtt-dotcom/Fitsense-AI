package com.fitsense.ai.viewmodel;

import android.graphics.Bitmap;
import android.os.Build;
import androidx.lifecycle.ViewModel;
import com.fitsense.ai.accuracy.AccuracyDatasetStore;
import com.fitsense.ai.camera.CameraXController;
import com.fitsense.ai.measurement.MeasurementValidator;
import com.fitsense.ai.measurement.CalibrationEngine;
import com.fitsense.ai.measurement.MeasurementEngine;
import com.fitsense.ai.measurement.Point2D;
import com.fitsense.ai.measurement.ReferenceMeasurement;
import com.fitsense.ai.models.CalibrationReference;
import com.fitsense.ai.models.Foot;
import com.fitsense.ai.models.FootMeasurement;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.recommendation.RecommendationEngine;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.utils.DataResult;
import com.fitsense.ai.vision.ImageOrientation;
import com.fitsense.ai.vision.ImageQualityProbe;
import com.fitsense.ai.vision.LandmarkBootstrap;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.StateFlow;
import java.util.UUID;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u00ae\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\b\u0007\u0018\u00002\u00020\u0001:\u0004EFGHBo\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u0012\u0006\u0010\n\u001a\u00020\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u0012\u0006\u0010\u000e\u001a\u00020\u000f\u0012\u0006\u0010\u0010\u001a\u00020\u0011\u0012\u0006\u0010\u0012\u001a\u00020\u0013\u0012\u0006\u0010\u0014\u001a\u00020\u0015\u0012\u0006\u0010\u0016\u001a\u00020\u0017\u0012\u0006\u0010\u0018\u001a\u00020\u0019\u0012\u0006\u0010\u001a\u001a\u00020\u001b\u00a2\u0006\u0002\u0010\u001cJ\u0006\u0010)\u001a\u00020*J\u001a\u0010+\u001a\u00020*2\u0012\u0010,\u001a\u000e\u0012\u0004\u0012\u00020.\u0012\u0004\u0012\u00020*0-J\u000e\u0010/\u001a\u00020*2\u0006\u00100\u001a\u000201J\b\u00102\u001a\u0004\u0018\u00010$J\u0006\u00103\u001a\u00020*J\u0016\u00104\u001a\u00020*2\u0006\u00105\u001a\u0002062\u0006\u00107\u001a\u000208J\b\u00109\u001a\u00020*H\u0014J\u0006\u0010:\u001a\u00020*J\u0006\u0010;\u001a\u00020*J\u001a\u0010<\u001a\u00020*2\u0012\u0010,\u001a\u000e\u0012\u0004\u0012\u00020.\u0012\u0004\u0012\u00020*0-J\u0006\u0010=\u001a\u00020*J\u000e\u0010>\u001a\u00020*2\u0006\u00105\u001a\u000206J\u000e\u0010?\u001a\u00020*2\u0006\u0010@\u001a\u00020AJ\u000e\u0010B\u001a\u00020*2\u0006\u0010C\u001a\u00020DR\u0014\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u001f0\u001eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0018\u001a\u00020\u0019X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\rX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010 \u001a\u00020\u00038F\u00a2\u0006\u0006\u001a\u0004\b!\u0010\"R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010#\u001a\u0004\u0018\u00010$X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001a\u001a\u00020\u001bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u000fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0016\u001a\u00020\u0017X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010%\u001a\b\u0012\u0004\u0012\u00020\u001f0&\u00a2\u0006\b\n\u0000\u001a\u0004\b\'\u0010(R\u000e\u0010\u0014\u001a\u00020\u0015X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006I"}, d2 = {"Lcom/fitsense/ai/viewmodel/ScanViewModel;", "Landroidx/lifecycle/ViewModel;", "cameraController", "Lcom/fitsense/ai/camera/CameraXController;", "imageOrientation", "Lcom/fitsense/ai/vision/ImageOrientation;", "imageQualityProbe", "Lcom/fitsense/ai/vision/ImageQualityProbe;", "landmarkBootstrap", "Lcom/fitsense/ai/vision/LandmarkBootstrap;", "referenceMeasurement", "Lcom/fitsense/ai/measurement/ReferenceMeasurement;", "calibrationEngine", "Lcom/fitsense/ai/measurement/CalibrationEngine;", "measurementEngine", "Lcom/fitsense/ai/measurement/MeasurementEngine;", "measurementValidator", "Lcom/fitsense/ai/measurement/MeasurementValidator;", "scanRepository", "Lcom/fitsense/ai/repository/ScanRepository;", "userRepository", "Lcom/fitsense/ai/repository/UserRepository;", "recommendationEngine", "Lcom/fitsense/ai/recommendation/RecommendationEngine;", "accuracyDatasetStore", "Lcom/fitsense/ai/accuracy/AccuracyDatasetStore;", "cloudSyncCoordinator", "Lcom/fitsense/ai/sync/CloudSyncCoordinator;", "(Lcom/fitsense/ai/camera/CameraXController;Lcom/fitsense/ai/vision/ImageOrientation;Lcom/fitsense/ai/vision/ImageQualityProbe;Lcom/fitsense/ai/vision/LandmarkBootstrap;Lcom/fitsense/ai/measurement/ReferenceMeasurement;Lcom/fitsense/ai/measurement/CalibrationEngine;Lcom/fitsense/ai/measurement/MeasurementEngine;Lcom/fitsense/ai/measurement/MeasurementValidator;Lcom/fitsense/ai/repository/ScanRepository;Lcom/fitsense/ai/repository/UserRepository;Lcom/fitsense/ai/recommendation/RecommendationEngine;Lcom/fitsense/ai/accuracy/AccuracyDatasetStore;Lcom/fitsense/ai/sync/CloudSyncCoordinator;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/fitsense/ai/viewmodel/ScanViewModel$UiState;", "camera", "getCamera", "()Lcom/fitsense/ai/camera/CameraXController;", "capturedBitmap", "Landroid/graphics/Bitmap;", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "acceptMeasurement", "", "captureScan", "onComplete", "Lkotlin/Function1;", "", "confirmFallbackLandmarks", "confirmed", "", "currentBitmap", "dismissError", "moveLandmark", "kind", "Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;", "point", "Lcom/fitsense/ai/measurement/Point2D;", "onCleared", "refreshPreview", "retake", "saveAcceptedScan", "scanOtherFoot", "selectLandmark", "setActiveFoot", "foot", "Lcom/fitsense/ai/models/Foot;", "setCalibration", "reference", "Lcom/fitsense/ai/models/CalibrationReference;", "LandmarkKind", "MarkupState", "ScanPhase", "UiState", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class ScanViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.camera.CameraXController cameraController = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.ImageOrientation imageOrientation = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.ImageQualityProbe imageQualityProbe = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.vision.LandmarkBootstrap landmarkBootstrap = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.ReferenceMeasurement referenceMeasurement = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.CalibrationEngine calibrationEngine = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.MeasurementEngine measurementEngine = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.measurement.MeasurementValidator measurementValidator = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.ScanRepository scanRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.repository.UserRepository userRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.recommendation.RecommendationEngine recommendationEngine = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.accuracy.AccuracyDatasetStore accuracyDatasetStore = null;
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.fitsense.ai.viewmodel.ScanViewModel.UiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.viewmodel.ScanViewModel.UiState> uiState = null;
    @org.jetbrains.annotations.Nullable()
    private android.graphics.Bitmap capturedBitmap;
    
    @javax.inject.Inject()
    public ScanViewModel(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.camera.CameraXController cameraController, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ImageOrientation imageOrientation, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.ImageQualityProbe imageQualityProbe, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.vision.LandmarkBootstrap landmarkBootstrap, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.ReferenceMeasurement referenceMeasurement, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.CalibrationEngine calibrationEngine, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.MeasurementEngine measurementEngine, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.MeasurementValidator measurementValidator, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ScanRepository scanRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepository userRepository, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.recommendation.RecommendationEngine recommendationEngine, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.accuracy.AccuracyDatasetStore accuracyDatasetStore, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.sync.CloudSyncCoordinator cloudSyncCoordinator) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.fitsense.ai.viewmodel.ScanViewModel.UiState> getUiState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.camera.CameraXController getCamera() {
        return null;
    }
    
    public final void setCalibration(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.CalibrationReference reference) {
    }
    
    public final void setActiveFoot(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.models.Foot foot) {
    }
    
    public final void captureScan(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onComplete) {
    }
    
    public final void selectLandmark(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind kind) {
    }
    
    public final void moveLandmark(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind kind, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.measurement.Point2D point) {
    }
    
    public final void refreshPreview() {
    }
    
    public final void confirmFallbackLandmarks(boolean confirmed) {
    }
    
    public final void acceptMeasurement() {
    }
    
    public final void scanOtherFoot() {
    }
    
    public final void saveAcceptedScan(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onComplete) {
    }
    
    public final void retake() {
    }
    
    public final void dismissError() {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final android.graphics.Bitmap currentBitmap() {
        return null;
    }
    
    @java.lang.Override()
    protected void onCleared() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0002\b\n\b\u0086\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002j\u0002\b\u0003j\u0002\b\u0004j\u0002\b\u0005j\u0002\b\u0006j\u0002\b\u0007j\u0002\b\bj\u0002\b\tj\u0002\b\n\u00a8\u0006\u000b"}, d2 = {"Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;", "", "(Ljava/lang/String;I)V", "RefCorner0", "RefCorner1", "RefCorner2", "RefCorner3", "Heel", "Toe", "WidthMedial", "WidthLateral", "app_debug"})
    public static enum LandmarkKind {
        /*public static final*/ RefCorner0 /* = new RefCorner0() */,
        /*public static final*/ RefCorner1 /* = new RefCorner1() */,
        /*public static final*/ RefCorner2 /* = new RefCorner2() */,
        /*public static final*/ RefCorner3 /* = new RefCorner3() */,
        /*public static final*/ Heel /* = new Heel() */,
        /*public static final*/ Toe /* = new Toe() */,
        /*public static final*/ WidthMedial /* = new WidthMedial() */,
        /*public static final*/ WidthLateral /* = new WidthLateral() */;
        
        LandmarkKind() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public static kotlin.enums.EnumEntries<com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind> getEntries() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b3\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B\u00a3\u0001\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\f\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006\u0012\u0006\u0010\b\u001a\u00020\u0007\u0012\u0006\u0010\t\u001a\u00020\u0007\u0012\u0006\u0010\n\u001a\u00020\u0007\u0012\u0006\u0010\u000b\u001a\u00020\u0007\u0012\u0006\u0010\f\u001a\u00020\r\u0012\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u0011\u0012\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\u0011\u0012\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0014\u0012\b\b\u0002\u0010\u0015\u001a\u00020\u0016\u0012\b\b\u0002\u0010\u0017\u001a\u00020\u0016\u0012\b\b\u0002\u0010\u0018\u001a\u00020\u0019\u0012\b\b\u0002\u0010\u001a\u001a\u00020\u0019\u00a2\u0006\u0002\u0010\u001bJ\t\u00107\u001a\u00020\u0003H\u00c6\u0003J\u0010\u00108\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003\u00a2\u0006\u0002\u0010+J\u0010\u00109\u001a\u0004\u0018\u00010\u0011H\u00c6\u0003\u00a2\u0006\u0002\u0010+J\u0010\u0010:\u001a\u0004\u0018\u00010\u0014H\u00c6\u0003\u00a2\u0006\u0002\u0010(J\t\u0010;\u001a\u00020\u0016H\u00c6\u0003J\t\u0010<\u001a\u00020\u0016H\u00c6\u0003J\t\u0010=\u001a\u00020\u0019H\u00c6\u0003J\t\u0010>\u001a\u00020\u0019H\u00c6\u0003J\t\u0010?\u001a\u00020\u0003H\u00c6\u0003J\u000f\u0010@\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006H\u00c6\u0003J\t\u0010A\u001a\u00020\u0007H\u00c6\u0003J\t\u0010B\u001a\u00020\u0007H\u00c6\u0003J\t\u0010C\u001a\u00020\u0007H\u00c6\u0003J\t\u0010D\u001a\u00020\u0007H\u00c6\u0003J\t\u0010E\u001a\u00020\rH\u00c6\u0003J\u000b\u0010F\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003J\u00bc\u0001\u0010G\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\u000e\b\u0002\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\b\b\u0002\u0010\b\u001a\u00020\u00072\b\b\u0002\u0010\t\u001a\u00020\u00072\b\b\u0002\u0010\n\u001a\u00020\u00072\b\b\u0002\u0010\u000b\u001a\u00020\u00072\b\b\u0002\u0010\f\u001a\u00020\r2\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\u00112\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u00142\b\b\u0002\u0010\u0015\u001a\u00020\u00162\b\b\u0002\u0010\u0017\u001a\u00020\u00162\b\b\u0002\u0010\u0018\u001a\u00020\u00192\b\b\u0002\u0010\u001a\u001a\u00020\u0019H\u00c6\u0001\u00a2\u0006\u0002\u0010HJ\u0013\u0010I\u001a\u00020\u00192\b\u0010J\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010K\u001a\u00020\u0003H\u00d6\u0001J\t\u0010L\u001a\u00020MH\u00d6\u0001R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0011\u0010\u001a\u001a\u00020\u0019\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001fR\u0011\u0010\u0017\u001a\u00020\u0016\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010!R\u0011\u0010\b\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\"\u0010#R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b$\u0010%R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b&\u0010%R\u0015\u0010\u0013\u001a\u0004\u0018\u00010\u0014\u00a2\u0006\n\n\u0002\u0010)\u001a\u0004\b\'\u0010(R\u0015\u0010\u0010\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\n\n\u0002\u0010,\u001a\u0004\b*\u0010+R\u0015\u0010\u0012\u001a\u0004\u0018\u00010\u0011\u00a2\u0006\n\n\u0002\u0010,\u001a\u0004\b-\u0010+R\u0017\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b.\u0010/R\u0011\u0010\u0015\u001a\u00020\u0016\u00a2\u0006\b\n\u0000\u001a\u0004\b0\u0010!R\u0011\u0010\u0018\u001a\u00020\u0019\u00a2\u0006\b\n\u0000\u001a\u0004\b1\u0010\u001fR\u0013\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b2\u00103R\u0011\u0010\t\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b4\u0010#R\u0011\u0010\u000b\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b5\u0010#R\u0011\u0010\n\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b6\u0010#\u00a8\u0006N"}, d2 = {"Lcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;", "", "imageWidth", "", "imageHeight", "refCorners", "", "Lcom/fitsense/ai/measurement/Point2D;", "heel", "toe", "widthMedial", "widthLateral", "activeFoot", "Lcom/fitsense/ai/models/Foot;", "selectedLandmark", "Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;", "previewLengthMm", "", "previewWidthMm", "previewConfidence", "", "refSource", "Lcom/fitsense/ai/vision/LandmarkSource;", "footSource", "requiresFallbackConfirmation", "", "fallbackConfirmed", "(IILjava/util/List;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/Float;Lcom/fitsense/ai/vision/LandmarkSource;Lcom/fitsense/ai/vision/LandmarkSource;ZZ)V", "getActiveFoot", "()Lcom/fitsense/ai/models/Foot;", "getFallbackConfirmed", "()Z", "getFootSource", "()Lcom/fitsense/ai/vision/LandmarkSource;", "getHeel", "()Lcom/fitsense/ai/measurement/Point2D;", "getImageHeight", "()I", "getImageWidth", "getPreviewConfidence", "()Ljava/lang/Float;", "Ljava/lang/Float;", "getPreviewLengthMm", "()Ljava/lang/Double;", "Ljava/lang/Double;", "getPreviewWidthMm", "getRefCorners", "()Ljava/util/List;", "getRefSource", "getRequiresFallbackConfirmation", "getSelectedLandmark", "()Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;", "getToe", "getWidthLateral", "getWidthMedial", "component1", "component10", "component11", "component12", "component13", "component14", "component15", "component16", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "(IILjava/util/List;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/measurement/Point2D;Lcom/fitsense/ai/models/Foot;Lcom/fitsense/ai/viewmodel/ScanViewModel$LandmarkKind;Ljava/lang/Double;Ljava/lang/Double;Ljava/lang/Float;Lcom/fitsense/ai/vision/LandmarkSource;Lcom/fitsense/ai/vision/LandmarkSource;ZZ)Lcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;", "equals", "other", "hashCode", "toString", "", "app_debug"})
    public static final class MarkupState {
        private final int imageWidth = 0;
        private final int imageHeight = 0;
        @org.jetbrains.annotations.NotNull()
        private final java.util.List<com.fitsense.ai.measurement.Point2D> refCorners = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D heel = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D toe = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D widthMedial = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.measurement.Point2D widthLateral = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.Foot activeFoot = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind selectedLandmark = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Double previewLengthMm = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Double previewWidthMm = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Float previewConfidence = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.vision.LandmarkSource refSource = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.vision.LandmarkSource footSource = null;
        private final boolean requiresFallbackConfirmation = false;
        private final boolean fallbackConfirmed = false;
        
        public MarkupState(int imageWidth, int imageHeight, @org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot activeFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind selectedLandmark, @org.jetbrains.annotations.Nullable()
        java.lang.Double previewLengthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Double previewWidthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Float previewConfidence, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource refSource, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource footSource, boolean requiresFallbackConfirmation, boolean fallbackConfirmed) {
            super();
        }
        
        public final int getImageWidth() {
            return 0;
        }
        
        public final int getImageHeight() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> getRefCorners() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getHeel() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getToe() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getWidthMedial() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D getWidthLateral() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot getActiveFoot() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind getSelectedLandmark() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double getPreviewLengthMm() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double getPreviewWidthMm() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Float getPreviewConfidence() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource getRefSource() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource getFootSource() {
            return null;
        }
        
        public final boolean getRequiresFallbackConfirmation() {
            return false;
        }
        
        public final boolean getFallbackConfirmed() {
            return false;
        }
        
        public final int component1() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double component10() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Double component11() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Float component12() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource component13() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.vision.LandmarkSource component14() {
            return null;
        }
        
        public final boolean component15() {
            return false;
        }
        
        public final boolean component16() {
            return false;
        }
        
        public final int component2() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.util.List<com.fitsense.ai.measurement.Point2D> component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component4() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component6() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.measurement.Point2D component7() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot component8() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind component9() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.viewmodel.ScanViewModel.MarkupState copy(int imageWidth, int imageHeight, @org.jetbrains.annotations.NotNull()
        java.util.List<com.fitsense.ai.measurement.Point2D> refCorners, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D heel, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D toe, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthMedial, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.measurement.Point2D widthLateral, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot activeFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.viewmodel.ScanViewModel.LandmarkKind selectedLandmark, @org.jetbrains.annotations.Nullable()
        java.lang.Double previewLengthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Double previewWidthMm, @org.jetbrains.annotations.Nullable()
        java.lang.Float previewConfidence, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource refSource, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.vision.LandmarkSource footSource, boolean requiresFallbackConfirmation, boolean fallbackConfirmed) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0002\b\u0005\b\u0086\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002j\u0002\b\u0003j\u0002\b\u0004j\u0002\b\u0005\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/viewmodel/ScanViewModel$ScanPhase;", "", "(Ljava/lang/String;I)V", "Camera", "Markup", "Review", "app_debug"})
    public static enum ScanPhase {
        /*public static final*/ Camera /* = new Camera() */,
        /*public static final*/ Markup /* = new Markup() */,
        /*public static final*/ Review /* = new Review() */;
        
        ScanPhase() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public static kotlin.enums.EnumEntries<com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase> getEntries() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0007\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\'\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B\u008b\u0001\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0005\u0012\b\b\u0002\u0010\u0006\u001a\u00020\u0007\u0012\b\b\u0002\u0010\b\u001a\u00020\t\u0012\b\b\u0002\u0010\n\u001a\u00020\u000b\u0012\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\r\u0012\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\u000f\u0012\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\u0013\u0012\n\b\u0002\u0010\u0014\u001a\u0004\u0018\u00010\u0013\u0012\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u0013\u00a2\u0006\u0002\u0010\u0016J\t\u0010+\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010,\u001a\u0004\u0018\u00010\u0013H\u00c6\u0003J\u000b\u0010-\u001a\u0004\u0018\u00010\u0013H\u00c6\u0003J\u000b\u0010.\u001a\u0004\u0018\u00010\u0013H\u00c6\u0003J\t\u0010/\u001a\u00020\u0005H\u00c6\u0003J\t\u00100\u001a\u00020\u0007H\u00c6\u0003J\t\u00101\u001a\u00020\tH\u00c6\u0003J\t\u00102\u001a\u00020\u000bH\u00c6\u0003J\u000b\u00103\u001a\u0004\u0018\u00010\rH\u00c6\u0003J\u000b\u00104\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003J\u000b\u00105\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003J\u000b\u00106\u001a\u0004\u0018\u00010\u000fH\u00c6\u0003J\u008f\u0001\u00107\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\t2\b\b\u0002\u0010\n\u001a\u00020\u000b2\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\r2\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0010\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\u000f2\n\b\u0002\u0010\u0012\u001a\u0004\u0018\u00010\u00132\n\b\u0002\u0010\u0014\u001a\u0004\u0018\u00010\u00132\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u0013H\u00c6\u0001J\u0013\u00108\u001a\u00020\t2\b\u00109\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010:\u001a\u00020;H\u00d6\u0001J\t\u0010<\u001a\u00020\u0013H\u00d6\u0001R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0018R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u001aR\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u001cR\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u001eR\u0013\u0010\u0012\u001a\u0004\u0018\u00010\u0013\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010 R\u0013\u0010\u000e\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010\"R\u0013\u0010\f\u001a\u0004\u0018\u00010\r\u00a2\u0006\b\n\u0000\u001a\u0004\b#\u0010$R\u0013\u0010\u0011\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b%\u0010\"R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b&\u0010\'R\u0013\u0010\u0010\u001a\u0004\u0018\u00010\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b(\u0010\"R\u0013\u0010\u0014\u001a\u0004\u0018\u00010\u0013\u00a2\u0006\b\n\u0000\u001a\u0004\b)\u0010 R\u0013\u0010\u0015\u001a\u0004\u0018\u00010\u0013\u00a2\u0006\b\n\u0000\u001a\u0004\b*\u0010 \u00a8\u0006="}, d2 = {"Lcom/fitsense/ai/viewmodel/ScanViewModel$UiState;", "", "phase", "Lcom/fitsense/ai/viewmodel/ScanViewModel$ScanPhase;", "calibration", "Lcom/fitsense/ai/models/CalibrationReference;", "activeFoot", "Lcom/fitsense/ai/models/Foot;", "capturing", "", "captureProgress", "", "markup", "Lcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;", "leftFoot", "Lcom/fitsense/ai/models/FootMeasurement;", "rightFoot", "pendingMeasurement", "errorMessage", "", "savedScanId", "statusMessage", "(Lcom/fitsense/ai/viewmodel/ScanViewModel$ScanPhase;Lcom/fitsense/ai/models/CalibrationReference;Lcom/fitsense/ai/models/Foot;ZFLcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;Lcom/fitsense/ai/models/FootMeasurement;Lcom/fitsense/ai/models/FootMeasurement;Lcom/fitsense/ai/models/FootMeasurement;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", "getActiveFoot", "()Lcom/fitsense/ai/models/Foot;", "getCalibration", "()Lcom/fitsense/ai/models/CalibrationReference;", "getCaptureProgress", "()F", "getCapturing", "()Z", "getErrorMessage", "()Ljava/lang/String;", "getLeftFoot", "()Lcom/fitsense/ai/models/FootMeasurement;", "getMarkup", "()Lcom/fitsense/ai/viewmodel/ScanViewModel$MarkupState;", "getPendingMeasurement", "getPhase", "()Lcom/fitsense/ai/viewmodel/ScanViewModel$ScanPhase;", "getRightFoot", "getSavedScanId", "getStatusMessage", "component1", "component10", "component11", "component12", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
    public static final class UiState {
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase phase = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.CalibrationReference calibration = null;
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.models.Foot activeFoot = null;
        private final boolean capturing = false;
        private final float captureProgress = 0.0F;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.viewmodel.ScanViewModel.MarkupState markup = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.models.FootMeasurement leftFoot = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.models.FootMeasurement rightFoot = null;
        @org.jetbrains.annotations.Nullable()
        private final com.fitsense.ai.models.FootMeasurement pendingMeasurement = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String errorMessage = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String savedScanId = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String statusMessage = null;
        
        public UiState(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase phase, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference calibration, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot activeFoot, boolean capturing, float captureProgress, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.viewmodel.ScanViewModel.MarkupState markup, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement leftFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement rightFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement pendingMeasurement, @org.jetbrains.annotations.Nullable()
        java.lang.String errorMessage, @org.jetbrains.annotations.Nullable()
        java.lang.String savedScanId, @org.jetbrains.annotations.Nullable()
        java.lang.String statusMessage) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase getPhase() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference getCalibration() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot getActiveFoot() {
            return null;
        }
        
        public final boolean getCapturing() {
            return false;
        }
        
        public final float getCaptureProgress() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.viewmodel.ScanViewModel.MarkupState getMarkup() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement getLeftFoot() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement getRightFoot() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement getPendingMeasurement() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getErrorMessage() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getSavedScanId() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getStatusMessage() {
            return null;
        }
        
        public UiState() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase component1() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component10() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component11() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component12() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.CalibrationReference component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.models.Foot component3() {
            return null;
        }
        
        public final boolean component4() {
            return false;
        }
        
        public final float component5() {
            return 0.0F;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.viewmodel.ScanViewModel.MarkupState component6() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement component7() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement component8() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final com.fitsense.ai.models.FootMeasurement component9() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.viewmodel.ScanViewModel.UiState copy(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.viewmodel.ScanViewModel.ScanPhase phase, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.CalibrationReference calibration, @org.jetbrains.annotations.NotNull()
        com.fitsense.ai.models.Foot activeFoot, boolean capturing, float captureProgress, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.viewmodel.ScanViewModel.MarkupState markup, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement leftFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement rightFoot, @org.jetbrains.annotations.Nullable()
        com.fitsense.ai.models.FootMeasurement pendingMeasurement, @org.jetbrains.annotations.Nullable()
        java.lang.String errorMessage, @org.jetbrains.annotations.Nullable()
        java.lang.String savedScanId, @org.jetbrains.annotations.Nullable()
        java.lang.String statusMessage) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
}