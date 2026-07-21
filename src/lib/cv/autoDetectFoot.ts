import type { Point } from "../homography";
import type { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

/**
 * MediaPipe-Pose-based foot landmark detection.
 *
 * Returns the image-pixel coordinates of the heel and the longest toe
 * for the foot that's closest to the camera. The MediaPipe Pose model
 * yields 33 body landmarks; we use the four foot landmarks:
 *
 *   27 LEFT_ANKLE   28 RIGHT_ANKLE
 *   29 LEFT_HEEL    30 RIGHT_HEEL
 *   31 LEFT_FOOT_INDEX (longest toe)   32 RIGHT_FOOT_INDEX
 *
 * The model is trained on full-body images, so it works best when the
 * scan frame includes the user's leg or at least the lower shin. Pure
 * top-down close-ups of a foot in isolation will likely fail. Callers
 * should always preserve the manual tap fallback.
 *
 * Implementation note: we lazy-import `@mediapipe/tasks-vision` so the
 * ML runtime (≈ 240 kB JS) and model (≈ 9 MB binary) aren't paid for
 * unless the user opts into auto-detect.
 */

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function getLandmarker(): Promise<PoseLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
    return PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: POSE_MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.4,
      minPosePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
  })().catch((err) => {
    landmarkerPromise = null;
    throw err;
  });
  return landmarkerPromise;
}

export interface AutoDetectFoot {
  heel: Point;
  toe: Point;
  /** Optional widest-medial / widest-lateral approximation (not from MediaPipe). */
  widthMedial?: Point;
  widthLateral?: Point;
  foot: "left" | "right";
  /** 0..1, model's reported confidence on the landmarks we used. */
  confidence: number;
}

export async function autoDetectFoot(
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): Promise<AutoDetectFoot | null> {
  const landmarker = await getLandmarker();
  const result: PoseLandmarkerResult = landmarker.detect(source);
  if (!result.landmarks || result.landmarks.length === 0) return null;

  const lms = result.landmarks[0];
  if (!lms || lms.length < 33) return null;

  // Pick whichever foot has the lower-y heel landmark (closer to bottom
  // of the image → most likely "the foot in the picture").
  const leftHeel = lms[29];
  const rightHeel = lms[30];
  const leftFootIndex = lms[31];
  const rightFootIndex = lms[32];

  const useRight =
    (rightHeel?.visibility ?? 0) + (rightFootIndex?.visibility ?? 0) >
    (leftHeel?.visibility ?? 0) + (leftFootIndex?.visibility ?? 0);

  const heel = useRight ? rightHeel : leftHeel;
  const toe = useRight ? rightFootIndex : leftFootIndex;
  if (!heel || !toe) return null;

  const width = sourceWidth(source);
  const height = sourceHeight(source);

  return {
    heel: { x: heel.x * width, y: heel.y * height },
    toe: { x: toe.x * width, y: toe.y * height },
    foot: useRight ? "right" : "left",
    confidence: Math.min(heel.visibility ?? 0, toe.visibility ?? 0),
  };
}

function sourceWidth(
  s: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): number {
  if (s instanceof HTMLCanvasElement) return s.width;
  if (s instanceof HTMLImageElement) return s.naturalWidth || s.width;
  return s.videoWidth || 0;
}

function sourceHeight(
  s: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): number {
  if (s instanceof HTMLCanvasElement) return s.height;
  if (s instanceof HTMLImageElement) return s.naturalHeight || s.height;
  return s.videoHeight || 0;
}

/** Frees the MediaPipe runtime. Optional — only useful if you're done scanning. */
export async function disposeFootLandmarker(): Promise<void> {
  if (!landmarkerPromise) return;
  try {
    const landmarker = await landmarkerPromise;
    landmarker.close();
  } catch {
    // ignore — initialisation may have failed
  } finally {
    landmarkerPromise = null;
  }
}
