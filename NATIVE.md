# FitSense AI · Native bridge

The FitSense web app runs entirely in the browser; **every feature works
without a native shell**. This document describes the optional
`FitSenseNative` bridge that a Capacitor / React Native / Cordova
container can mount to unlock higher-accuracy capture paths on devices
with native depth or AR hardware (iPhone Pro LiDAR, Pixel 8 Pro
ToF sensor, Samsung S24 Ultra, ARKit/ARCore, etc.).

The web app probes `window.FitSenseNative` at boot — if absent it
proceeds with the standard reference-based scanner (A4 / bank card) and
the WebXR AR plane mode. There is **no code branch** that requires a
native shell.

---

## Quick start — the bundled iOS plugin (recommended path)

This repo ships a turnkey iOS Capacitor plugin in
[`ios/App/App/Plugins/`](ios/App/App/Plugins/) plus a Capacitor config at
[`capacitor.config.ts`](capacitor.config.ts). After running the
bootstrap commands below on a Mac, the plugin is automatically wired
into `window.FitSenseNative` via
[`src/lib/native/capacitorBridge.ts`](src/lib/native/capacitorBridge.ts).

```bash
# 1. Build the web bundle that Capacitor will package.
npm run build

# 2. Materialise the Xcode project. This copies ios/* into the
#    generated workspace.
npx cap add ios
npx cap sync ios

# 3. Add the privacy strings ARKit + camera need to Info.plist.
#    See "Required Info.plist keys" below.

# 4. Open in Xcode, sign with your developer account, run on device.
#    (ARKit does NOT work on the iOS simulator.)
npx cap open ios
```

### Required `Info.plist` keys

```xml
<key>NSCameraUsageDescription</key>
<string>FitSense uses the camera to measure your foot in AR.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Optionally save a scan reference photo.</string>
```

ARKit itself requires no entitlements beyond the camera string.

### What you get

The web layer's `nativeMeasureFoot()` call now opens a full-screen
ARKit view that:

1. Detects a horizontal floor plane.
2. Locks the heel on first tap (reticle goes green).
3. Locks the longest toe on second tap.
4. Returns `{ lengthMm, widthMm, confidence: 0.95, source: "arkit" }`
   to the web layer, which routes it through the existing recommender.

Width is currently derived from a population ratio in the iOS path —
combine with the web pipeline's GrabCut segmentation for an
independently-measured width.

---

## Manual Capacitor bootstrap (no bundled plugin)

If you prefer to roll your own bridge instead of using `FitSenseAR`:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init fitsense-ai com.fitsense.app --web-dir dist
npx cap add ios
npx cap add android
```

In your bootstrap (`ios/App/App/AppDelegate.swift`, etc.) inject a JS
object before the web view loads its main bundle:

```swift
let bridge = WKUserScript(
  source: """
    window.FitSenseNative = {
      getCapabilities: () => Promise.resolve({
        hasDepthSensor: \(hasDepthSensor),
        hasArkit: true,
        hasArcore: false,
        platform: 'ios-capacitor'
      }),
      measureFoot: () => window.bridge.call('FitSenseNative', 'measureFoot'),
      subscribeDepth: (cb) => window.bridge.subscribe('FitSenseNative', 'depth', cb),
      openCameraSettings: () => window.bridge.call('FitSenseNative', 'openSettings')
    };
  """,
  injectionTime: .atDocumentStart,
  forMainFrameOnly: true
)
webView.configuration.userContentController.addUserScript(bridge)
```

That single object is the entire contract.

---

## Interface (TypeScript)

```ts
interface FitSenseNative {
  getCapabilities(): Promise<NativeCapabilities> | NativeCapabilities;
  measureFoot?(): Promise<NativeFootMeasurement>;
  subscribeDepth?(cb: (frame: DepthFrame) => void): () => void;
  openCameraSettings?(): void;
}

interface NativeCapabilities {
  hasDepthSensor: boolean;
  hasArkit: boolean;
  hasArcore: boolean;
  platform: string;
}

interface NativeFootMeasurement {
  lengthMm: number;
  widthMm: number;
  archHeightMm?: number;
  confidence: number; // 0..1
  source: string;     // 'lidar' | 'arkit' | 'arcore' | 'fallback'
}

interface DepthFrame {
  data: Float32Array; // row-major depth, width*height elements
  width: number;
  height: number;
  intrinsics?: { fx: number; fy: number; cx: number; cy: number };
  capturedAtEpochMs: number;
}
```

### Method semantics

- `getCapabilities()` is the only required method. The web app calls it
  once at boot to decide whether to surface a "native scan" CTA.
- `measureFoot()` should perform a single, fully-native capture session
  (LiDAR scan + segmentation) and return the result. **Frames must never
  leave the device.** The web app trusts the resulting numbers as
  ground truth.
- `subscribeDepth()` is optional and only used for advanced
  debugging / next-gen fitting flows.
- `openCameraSettings()` is invoked from the permission-denied modal
  on platforms where deep-linking to system settings yields a better UX
  than the browser's permission re-prompt.

---

## Privacy contract

A FitSense native shell **must not**:

- Upload, log, or persist raw camera frames or depth maps.
- Run any analytics SDKs that hook into camera frames.
- Share scan results with third parties before the user explicitly taps
  *Apply size* in the FitSense UI.

The web app surfaces these guarantees in the privacy section of the
welcome screen; a shell that violates them invalidates the brand
promise.

---

## Why not just use Capacitor's `@capacitor/camera` plugin?

The off-the-shelf camera plugin returns a JPEG, not a calibrated depth
buffer. We already have a perfectly good camera capture path via the
browser's `getUserMedia` — the *point* of a native shell is to access
the hardware the browser can't:

- iPhone Pro / Pro Max LiDAR
- Pixel 8 Pro ToF depth
- Galaxy S24 Ultra ARCore Depth API
- Polynesian / regional mass-customisation hardware that ships its own
  SDK

If a partner only wants "camera in a native app", the standard PWA
shell is simpler and we recommend that path.

---

## Testing locally without a real device

The bridge interface is pure JS, so unit-testing is as simple as
mounting a mock object before the bundle boots:

```js
window.FitSenseNative = {
  getCapabilities: async () => ({
    hasDepthSensor: true,
    hasArkit: true,
    hasArcore: false,
    platform: 'mock',
  }),
  measureFoot: async () => ({
    lengthMm: 267.4,
    widthMm: 101.2,
    confidence: 0.97,
    source: 'lidar',
  }),
};
```

A future release will ship a `tools/mock-native.html` demo for partners
to play with the integration in their own browser.
