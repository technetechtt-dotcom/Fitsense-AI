# FitSense AI

AR-assisted foot sizing and shoe recommendation MVP for Android.

FitSense AI scans the user's foot with the smartphone camera, measures foot
length & width using ARCore + OpenCV, then maps those measurements to UK / US
/ EU sizes and produces a ranked list of shoes with fit and comfort scores.

---

## Tech stack

| Layer           | Technology                                                 |
| --------------- | ---------------------------------------------------------- |
| Language        | Kotlin 1.9                                                 |
| UI              | Jetpack Compose + Material 3 + Navigation Compose          |
| Architecture    | MVVM + Clean (Repository ports / adapters)                 |
| Async           | Coroutines + StateFlow                                     |
| DI              | Hilt (Dagger)                                              |
| Camera          | CameraX 1.3.x (PreviewView + ImageAnalysis + ImageCapture) |
| AR              | ARCore 1.42 (plane detection + camera intrinsics)          |
| Computer Vision | OpenCV 4.9 (Maven Central artifact `org.opencv:opencv`)    |
| Backend         | Firebase Auth (anon), Firestore, Storage                   |
| Build           | AGP 8.4 + Kotlin DSL + Version Catalog                     |

---

## Project structure

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── google-services.example.json
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/fitsense/ai/
│       │   ├── FitSenseApp.kt           # @HiltAndroidApp + OpenCV bootstrap
│       │   ├── MainActivity.kt          # Hosts Compose nav graph
│       │   ├── ar/                      # ARCore session + plane state
│       │   ├── camera/                  # CameraX controller + frame analyzer
│       │   ├── di/                      # Hilt modules (App, Firebase, Repo)
│       │   ├── firebase/                # Auth / Firestore / Storage services
│       │   ├── measurement/             # Calibration + measurement engines
│       │   ├── models/                  # Domain models (data classes)
│       │   ├── recommendation/          # Size table + recommendation engine
│       │   ├── repository/              # User / Scan / Product repositories
│       │   ├── ui/
│       │   │   ├── components/          # Reusable Compose widgets
│       │   │   ├── navigation/          # Nav graph + destinations
│       │   │   ├── screens/             # 8 feature screens
│       │   │   └── theme/               # Color, Type, Shapes, Theme
│       │   ├── utils/                   # Result, Constants, Extensions
│       │   ├── viewmodel/               # 8 Hilt-injected ViewModels
│       │   └── vision/                  # OpenCV foot detection pipeline
│       └── res/                         # M3 themes, strings, drawables, XML
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── gradle/
    ├── libs.versions.toml               # Centralised version catalog
    └── wrapper/gradle-wrapper.properties
```

---

## Setup

### 1. Prerequisites

- **Android Studio Hedgehog (2023.1.1) or newer** with the Android SDK 34
  installed.
- **JDK 17+** for Gradle (bundled with Android Studio as `jbr`). AGP 8.4 will
  fail if an older `JAVA_HOME` (e.g. Java 11) is picked — `gradle.properties`
  points at `C:/Program Files/Android/Android Studio/jbr` on Windows; comment
  that line out on other OSes and set `JAVA_HOME` instead.
- A physical Android device for AR testing (most emulators can't run ARCore).
  ARCore-supported devices: <https://developers.google.com/ar/devices>.

### 2. Clone & open

```bash
git clone <your-fork>.git
cd Fitsense\ AI/android
```

Open `android/` in Android Studio and let Gradle sync.

The Gradle wrapper jar is intentionally omitted from source control. On first
sync Android Studio will download it automatically. If you want to build from
the command line first, run:

```bash
gradle wrapper --gradle-version 8.7
./gradlew :app:assembleDebug
```

### 3. Firebase

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Add an Android app with package id `com.fitsense.ai` (and a second one,
   `com.fitsense.ai.debug`, for the debug build flavour).
3. Enable **Anonymous Authentication**, **Cloud Firestore** (start in
   _production_ mode and apply the rules below), and **Storage**.
4. Download `google-services.json` and drop it into `android/app/`.
   A template lives at `android/app/google-services.example.json`.

Suggested Firestore rules (read/write only your own scans):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /scans/{scanId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /products/{productId} { allow read: if true; }
  }
}
```

### 4. Run

- Connect an ARCore-capable device.
- Select the `app` configuration and hit **Run** (▶︎).

The app launches into the in-app splash → onboarding (first launch only) →
home screen. Tap **Start scan** to enter the AR scan flow.

---

## Architecture notes

### MVVM + Clean

Each feature screen has:

- **Composable screen** (`ui/screens/<feature>/<Feature>Screen.kt`) — pure UI.
- **Hilt ViewModel** (`viewmodel/<Feature>ViewModel.kt`) — owns `StateFlow`s
  and orchestrates repository calls.
- **Repository interface** (`repository/`) — domain port.
- **Repository implementation** — Firestore + Firebase Storage adapter.

The `DataResult` envelope (`utils/Result.kt`) is used end-to-end instead of
throwing across coroutine boundaries, so the ViewModels can map errors into
typed UI states cleanly.

### Vision + measurement pipeline

1. **CameraX** streams the live preview into Compose via `PreviewView` inside
   an `AndroidView`. `FootImageAnalyzer` (an `ImageAnalysis` analyzer)
   produces ~10 Hz downsampled bitmaps.
2. **ARCore** is started in parallel by `ArCoreSessionManager` for plane
   detection. The session is GL-renderer-free; we only use it for:
   - `Plane` extents and tracking state
   - `CameraIntrinsics.focalLength` (pixels) for the calibration engine.
3. **OpenCV** (`ImagePreprocessor` → `FootContourDetector`) detects the foot
   contour and returns heel / toe / width-span points + a confidence score.
4. **`CalibrationEngine`** computes `pixelsPerMm`. Two strategies:
   - **ARCore plane** — focal length / plane distance → real-world scale.
   - **Reference card** — known dimensions of A4 paper or an ID-1 bank card.
5. **`MeasurementEngine`** combines the above into a `FootMeasurement`.

### Recommendation engine

`RecommendationEngine`:

- Maps foot length (+ heel-margin) → UK / US / EU / Mondopoint sizes via
  `SizeMappingTable`.
- For each product in the catalogue, snaps the user's EU size to the product's
  step, then computes `fitScore` (last vs foot width-to-length ratio, wide-foot
  bonus) and `comfortScore` (centeredness in size range, category boost,
  confidence floor).
- Returns the top-K matches.

Brand placeholder catalogue (`ShoeCatalog`) includes Nike (Pegasus, Air Max),
Adidas (Ultraboost, Samba), Puma (Velocity Nitro, Suede), New Balance, and
two local brands (Bata Power, North Star).

### Firebase model

```
users/{uid}
  ├── userId, displayName, email, isAnonymous
  ├── cachedFootLengthMm, cachedFootWidthMm
  ├── preferences: { units, defaultCalibration, analyticsOptIn, preferredBrands }
  └── scans/{scanId}
        ├── createdAtEpochMs, deviceModel, arcoreUsed
        ├── leftFoot, rightFoot:  { lengthMm, widthMm, confidence, calibration, ... }
        └── recommendation:       { uk, us, eu, mondopointMm, matches[] }

products/{productId}
  └── { brand, model, category, fitType, sizeRangeEu, priceUsd, imageUrl, ... }
```

When `products/` is empty (fresh project), `ProductRepository` falls back to
the bundled `ShoeCatalog` so the demo flow always has something to show.

---

## OpenCV fallback

If your build can't resolve `org.opencv:opencv:4.9.0` for any reason
(corporate mirror, etc.), you can swap in the official OpenCV Android SDK as a
local module:

1. Download the Android SDK from <https://opencv.org/releases/>.
2. In Android Studio: **File → Import Module…** and point it at
   `OpenCV-android-sdk/sdk`.
3. In `app/build.gradle.kts`, replace
   `implementation(libs.opencv)` with `implementation(project(":sdk"))`.
4. Update `settings.gradle.kts` to include the new module.

The rest of the FitSense vision code is unchanged because everything routes
through `org.opencv.*` packages.

---

## Performance notes for mid-range devices

- The CameraX analysis pipeline uses `STRATEGY_KEEP_ONLY_LATEST` so the OpenCV
  detector never queues up frames.
- `FootImageAnalyzer` throttles itself to ~10 Hz (`throttleNs = 100ms`).
- ARCore is configured `UpdateMode.LATEST_CAMERA_IMAGE`.
- All native OpenCV `Mat`s are released in `finally` blocks (see
  `FootContourDetector` / `ImagePreprocessor`).
- The Compose AR overlay uses a single `Canvas` with cached path geometry, no
  per-frame allocations.
- R8 full mode + ABI splits (`arm64-v8a` + `x86_64`) keep release APKs lean.

---

## Roadmap (post-MVP)

- **Stereo / depth scan** for more accurate width using ToF sensors on Pixel
  devices.
- **CameraX + ARCore Shared Camera** so the preview is rendered directly by
  ARCore (currently CameraX provides the visible preview; ARCore only consumes
  metadata).
- **Phone-based ML** (TensorFlow Lite) for foot segmentation, replacing the
  current Canny + contour approach for cluttered backgrounds.
- **Sign-in providers** (Google, Email/password) and account-merge from anon.
- **Retailer dashboard** (Firestore-backed admin app).

---

## License

Internal / proprietary — see your organisation's policy.
