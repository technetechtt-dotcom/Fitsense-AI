/**
 * Lazy-loader for OpenCV.js (≈ 8.6 MB minified WASM bundle).
 *
 * We never want OpenCV in the main app's startup payload — it's only
 * fetched the first time the user taps "Auto-detect reference" inside
 * the scanner. The loader is also memoised so multiple call sites share
 * the same promise.
 *
 * Versions: pinned to OpenCV.js 4.10.0 from the official docs CDN.
 * Fallback: if the CDN is unreachable the promise rejects and callers
 * fall back to manual tap-to-mark.
 */

declare global {
  interface Window {
    cv?: OpenCv;
  }
}

/**
 * Minimal subset of OpenCV.js bindings we actually use. We intentionally
 * keep this narrow rather than pulling in @types/opencv4nodejs which
 * doesn't match the browser bundle.
 */
export interface OpenCv {
  Mat: {
    new (rows?: number, cols?: number, type?: number): OcvMat;
    zeros: (rows: number, cols: number, type: number) => OcvMat;
  };
  MatVector: { new (): OcvMatVector };
  Size: { new (width: number, height: number): OcvSize };
  Point: { new (x: number, y: number): OcvPoint };
  Rect: { new (x: number, y: number, width: number, height: number): OcvRect };
  Scalar: {
    new (v0: number, v1?: number, v2?: number, v3?: number): OcvScalar;
  };
  imread: (canvas: HTMLCanvasElement | string) => OcvMat;
  cvtColor: (src: OcvMat, dst: OcvMat, code: number) => void;
  GaussianBlur: (src: OcvMat, dst: OcvMat, ksize: OcvSize, sigmaX: number) => void;
  Canny: (src: OcvMat, dst: OcvMat, threshold1: number, threshold2: number) => void;
  findContours: (
    image: OcvMat,
    contours: OcvMatVector,
    hierarchy: OcvMat,
    mode: number,
    method: number,
  ) => void;
  arcLength: (curve: OcvMat, closed: boolean) => number;
  approxPolyDP: (
    curve: OcvMat,
    approx: OcvMat,
    epsilon: number,
    closed: boolean,
  ) => void;
  contourArea: (contour: OcvMat) => number;
  isContourConvex: (contour: OcvMat) => boolean;
  /**
   * Iterative GrabCut foreground extraction. Signature mirrors the
   * OpenCV-Python binding.
   */
  grabCut: (
    img: OcvMat,
    mask: OcvMat,
    rect: OcvRect,
    bgdModel: OcvMat,
    fgdModel: OcvMat,
    iterCount: number,
    mode: number,
  ) => void;
  rectangle: (
    img: OcvMat,
    pt1: OcvPoint,
    pt2: OcvPoint,
    color: OcvScalar,
    thickness?: number,
  ) => void;
  COLOR_RGBA2GRAY: number;
  COLOR_RGBA2RGB: number;
  RETR_LIST: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  CV_8UC1: number;
  CV_8UC3: number;
  CV_64FC1: number;
  GC_INIT_WITH_RECT: number;
  GC_INIT_WITH_MASK: number;
  GC_BGD: number;
  GC_FGD: number;
  GC_PR_BGD: number;
  GC_PR_FGD: number;
  onRuntimeInitialized?: () => void;
}

export interface OcvMat {
  rows: number;
  cols: number;
  data: Uint8Array;
  data32S: Int32Array;
  ucharPtr: (row: number, col: number) => Uint8Array;
  /** Element type, e.g. CV_8UC1. */
  type: () => number;
  delete: () => void;
}

export interface OcvPoint {
  x: number;
  y: number;
}

export interface OcvRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcvScalar {
  [index: number]: number;
}

export interface OcvMatVector {
  size: () => number;
  get: (i: number) => OcvMat;
  delete: () => void;
}

export interface OcvSize {
  width: number;
  height: number;
}

const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";

let cached: Promise<OpenCv> | null = null;

/** Load OpenCV.js once. Subsequent calls re-use the cached promise. */
export function loadOpenCv(url: string = OPENCV_URL): Promise<OpenCv> {
  if (cached) return cached;
  cached = new Promise<OpenCv>((resolve, reject) => {
    // Already loaded by an earlier script tag?
    if (window.cv && typeof window.cv.Mat === "function") {
      resolve(window.cv);
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = url;
    script.crossOrigin = "anonymous";
    script.onerror = () => reject(new Error("Failed to load OpenCV.js from " + url));
    script.onload = () => {
      // The OpenCV runtime resolves asynchronously after the script tag
      // executes — we have to wait for `onRuntimeInitialized`.
      const tryResolve = () => {
        const cv = window.cv;
        if (!cv) return false;
        if (typeof cv.Mat === "function") {
          resolve(cv);
          return true;
        }
        if (cv.onRuntimeInitialized) {
          // already set by a previous load attempt; nothing to do.
          return false;
        }
        cv.onRuntimeInitialized = () => resolve(window.cv as OpenCv);
        return true;
      };
      if (!tryResolve()) {
        // Poll briefly in case the runtime hook hasn't been attached yet.
        let elapsed = 0;
        const iv = setInterval(() => {
          elapsed += 100;
          if (tryResolve()) {
            clearInterval(iv);
          } else if (elapsed > 8000) {
            clearInterval(iv);
            reject(new Error("OpenCV.js runtime didn't initialise."));
          }
        }, 100);
      }
    };
    document.head.appendChild(script);
  });
  return cached;
}
