/**
 * Minimal WebXR type stubs. The official `@types/webxr` package is
 * extensive and not all of it ships in browser typelib defaults. We
 * declare only what the `ArScanner` actually touches; adding more is
 * straightforward as we expand.
 */

declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported: (mode: XRSessionMode) => Promise<boolean>;
    requestSession: (
      mode: XRSessionMode,
      options?: XRSessionInit,
    ) => Promise<XRSession>;
  }

  type XRSessionMode = "inline" | "immersive-vr" | "immersive-ar";
  type XRReferenceSpaceType =
    "viewer" | "local" | "local-floor" | "bounded-floor" | "unbounded";

  interface XRSessionInit {
    requiredFeatures?: string[];
    optionalFeatures?: string[];
  }

  // Intentionally NOT extending `EventTarget` — the DOM lib's `addEventListener`
  // signature accepts `null` callbacks, which conflicts with our narrowly-typed
  // XR session events. The runtime object IS an EventTarget; we just opt out of
  // the structural type compat to keep call sites strict.
  interface XRSession {
    end: () => Promise<void>;
    updateRenderState: (state: XRRenderStateInit) => Promise<void>;
    renderState: XRRenderState;
    requestAnimationFrame: (cb: XRFrameRequestCallback) => number;
    requestReferenceSpace: (type: XRReferenceSpaceType) => Promise<XRReferenceSpace>;
    requestHitTestSource?: (options: { space: XRSpace }) => Promise<XRHitTestSource>;
    addEventListener: (type: string, listener: (e: XRSessionEvent) => void) => void;
    removeEventListener: (type: string, listener: (e: XRSessionEvent) => void) => void;
  }

  interface XRRenderState {
    baseLayer: XRWebGLLayer;
  }

  interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
  }

  interface XRWebGLLayerInit {
    antialias?: boolean;
    alpha?: boolean;
  }

  interface XRWebGLLayer {
    framebuffer: WebGLFramebuffer | null;
    getViewport: (view: XRView) => XRViewport | null;
  }

  const XRWebGLLayer: {
    new (
      session: XRSession,
      ctx: WebGLRenderingContext | WebGL2RenderingContext,
      options?: XRWebGLLayerInit,
    ): XRWebGLLayer;
  };

  type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;

  interface XRFrame {
    session: XRSession;
    getViewerPose: (referenceSpace: XRReferenceSpace) => XRViewerPose | null;
    getHitTestResults: (source: XRHitTestSource) => XRHitTestResult[];
  }

  interface XRViewerPose {
    transform: XRRigidTransform;
    views: XRView[];
  }

  interface XRView {
    projectionMatrix: Float32Array;
    transform: XRRigidTransform;
  }

  interface XRViewport {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface XRRigidTransform {
    matrix: Float32Array;
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
  }

  interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace: (origin: XRRigidTransform) => XRReferenceSpace;
  }

  interface XRSpace {
    readonly __xrspace: never;
  }

  interface XRHitTestSource {
    cancel: () => void;
  }

  interface XRHitTestResult {
    getPose: (referenceSpace: XRReferenceSpace) => XRPose | null;
  }

  interface XRPose {
    transform: XRRigidTransform;
  }

  interface XRSessionEvent extends Event {
    session: XRSession;
  }
}

export {};
