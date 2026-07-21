import { useCallback, useEffect, useRef, useState } from "react";
import {
  enumerateCameras,
  pickPreferredCamera,
  type CameraDevice,
} from "./cameraDevices";

/**
 * Reusable camera hook that:
 *
 *   - Defers the `getUserMedia` call until the host opts in with
 *     {@link start} — essential on iOS Safari where the prompt must
 *     follow a user gesture, otherwise it's denied silently.
 *   - Surfaces a clear `denied` state with a retry path; the host can
 *     render a "How to re-enable the camera" modal off this signal.
 *   - Re-enumerates cameras after permission is granted so labels
 *     populate (browsers anonymise them pre-grant).
 *   - Lets callers switch between back cameras via {@link switchCamera}
 *     without restarting the page.
 *
 * Tracks a single stream at a time; switching cleanly stops the old
 * stream before requesting the new one.
 */

export type CameraState =
  | { kind: "idle" }
  | { kind: "starting" }
  | {
      kind: "live";
      stream: MediaStream;
      device: CameraDevice | null;
      cameras: CameraDevice[];
    }
  | { kind: "denied"; message: string; recoverable: boolean }
  | { kind: "unavailable"; message: string };

export interface UseCameraOptions {
  /** Constraints overlay merged into the default `getUserMedia` call. */
  videoConstraints?: MediaTrackConstraints;
  /** Called once a fresh stream is attached. Use this to bind to <video>. */
  onStreamReady?: (stream: MediaStream) => void;
}

export interface UseCameraApi {
  state: CameraState;
  start: () => Promise<void>;
  switchCamera: (deviceId: string) => Promise<void>;
  stop: () => void;
  /** Re-attempts permission after a denial. */
  retry: () => Promise<void>;
}

const DEFAULT_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

export function useCamera(options: UseCameraOptions = {}): UseCameraApi {
  const [state, setState] = useState<CameraState>({ kind: "idle" });
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState({ kind: "idle" });
  }, []);

  const acquire = useCallback(
    async (constraintsOverride?: MediaTrackConstraints) => {
      setState({ kind: "starting" });
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setState({
            kind: "unavailable",
            message: "Your browser doesn't support live camera access (getUserMedia).",
          });
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...DEFAULT_CONSTRAINTS,
            ...(constraintsOverride ?? options.videoConstraints),
          },
          audio: false,
        });
        // Stop the previous stream after the new one is up to avoid black frames.
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        options.onStreamReady?.(stream);
        const cameras = await enumerateCameras();
        // Best-effort match the currently bound deviceId to a camera entry.
        const settings = stream.getVideoTracks()[0]?.getSettings();
        const device =
          cameras.find((c) => c.deviceId === settings?.deviceId) ??
          pickPreferredCamera(cameras);
        setState({ kind: "live", stream, device, cameras });
      } catch (err) {
        const message = describePermissionError(err);
        const recoverable =
          (err as DOMException)?.name === "NotAllowedError" ||
          (err as DOMException)?.name === "SecurityError";
        setState({ kind: "denied", message, recoverable });
      }
    },
    [options],
  );

  const start = useCallback(() => acquire(), [acquire]);
  const retry = useCallback(() => acquire(), [acquire]);
  const switchCamera = useCallback(
    (deviceId: string) =>
      acquire({
        deviceId: { exact: deviceId },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      }),
    [acquire],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return { state, start, switchCamera, stop, retry };
}

function describePermissionError(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "Camera permission was denied. Tap 'Try again' after enabling it in your browser settings.";
      case "NotFoundError":
        return "No camera was found on this device.";
      case "NotReadableError":
        return "Another app is using the camera — close it and try again.";
      case "OverconstrainedError":
        return "Couldn't find a camera matching the requested settings.";
      case "SecurityError":
        return "The camera was blocked for security reasons. Make sure you're on HTTPS.";
    }
  }
  return err instanceof Error ? err.message : "Couldn't start the camera.";
}
