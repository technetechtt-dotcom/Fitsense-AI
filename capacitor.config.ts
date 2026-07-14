import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for the iOS shell.
 *
 * The shell wraps the **already-built** web bundle (the `dist/` directory
 * produced by `npm run build`) inside a WKWebView and exposes the
 * `FitSenseAR` native plugin defined in `ios/App/App/Plugins/`.
 *
 * Bootstrap on a Mac:
 *   $ npm run build
 *   $ npx cap add ios
 *   $ npx cap sync ios
 *   $ npx cap open ios   # Opens Xcode; sign + run on a real device.
 *
 * The plugin sources in this repo's `ios/` subtree are copied into the
 * generated Xcode project by `npx cap sync ios` (Capacitor follows the
 * `includePlugins` discovery on `ios/App/Pods` + `cap.config.json`).
 */
const config: CapacitorConfig = {
  appId: "ai.fitsense.app",
  appName: "FitSense AI",
  webDir: "dist",
  ios: {
    // ARKit / camera-only — no entitlements needed beyond Info.plist
    // privacy strings.
    contentInset: "automatic",
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
