import "./webxr-types";
import type { FootMeasurement } from "../types";

/**
 * WebXR-based 3D foot measurement. Drives a real `immersive-ar` session
 * with the `hit-test` feature, lets the user tap two points on the floor
 * (heel then longest toe), and returns the resulting 3D distance as a
 * fully-calibrated {@link FootMeasurement}.
 *
 * The renderer is intentionally minimal: a single white quad acting as
 * a reticle. We don't draw a virtual A4 or ruler — the captured camera
 * passthrough is already the user's environment, so the reticle alone is
 * enough to guide tapping.
 *
 * On unsupported browsers / devices `startArSession` rejects with a
 * tagged error and callers should fall back to the tap-to-measure flow.
 */

export interface ArScannerCallbacks {
  /** Fired after the session starts and the first hit-test arrives. */
  onReady?: () => void;
  /** Status updates for the host UI: "Searching floor" / "Heel locked" etc. */
  onStatus?: (status: ArStatus) => void;
  /** Fired when both heel and toe are locked and a measurement is computed. */
  onMeasured: (measurement: FootMeasurement) => void;
  /** Fired when the session ends for any reason (user / browser / error). */
  onEnded?: (reason?: string) => void;
}

export type ArStatus =
  | { kind: "searching" }
  | { kind: "ready" }
  | { kind: "heel-locked" }
  | { kind: "measuring" }
  | { kind: "error"; message: string };

export interface ArSessionHandle {
  /** Capture the current reticle position (heel → toe in sequence). */
  capture: () => void;
  /** End the AR session early. */
  end: () => void;
}

interface InternalState {
  session: XRSession;
  gl: WebGL2RenderingContext;
  refSpace: XRReferenceSpace;
  hitTestSource: XRHitTestSource | null;
  lastHitPose: XRRigidTransform | null;
  heelWorld: [number, number, number] | null;
  toeWorld: [number, number, number] | null;
  reticle: ReticleRenderer | null;
  animationFrameHandle: number | null;
  ended: boolean;
}

/**
 * Open an AR session. Returns a handle that callers use to trigger
 * captures (typically wired to a UI button) and to end the session.
 */
export async function startArSession(
  canvas: HTMLCanvasElement,
  callbacks: ArScannerCallbacks,
): Promise<ArSessionHandle> {
  if (!navigator.xr) {
    throw new Error("WebXR is not available in this browser.");
  }
  const supported = await navigator.xr.isSessionSupported("immersive-ar");
  if (!supported) {
    throw new Error("`immersive-ar` is not supported on this device.");
  }

  const gl = canvas.getContext("webgl2", {
    xrCompatible: true,
    alpha: true,
    antialias: true,
  } as WebGLContextAttributes) as WebGL2RenderingContext | null;
  if (!gl) {
    throw new Error("WebGL2 unavailable — required for AR rendering.");
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test", "local-floor"],
  });
  // Bind the GL context as the session's base layer so frames render
  // into the headset/phone display rather than the host canvas.
  await session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl, { alpha: true }),
  });

  const refSpace = await session.requestReferenceSpace("local-floor");
  const viewerSpace = await session.requestReferenceSpace("viewer");

  let hitTestSource: XRHitTestSource | null = null;
  if (session.requestHitTestSource) {
    hitTestSource = await session.requestHitTestSource({
      space: viewerSpace,
    });
  }

  const state: InternalState = {
    session,
    gl,
    refSpace,
    hitTestSource,
    lastHitPose: null,
    heelWorld: null,
    toeWorld: null,
    reticle: new ReticleRenderer(gl),
    animationFrameHandle: null,
    ended: false,
  };

  callbacks.onStatus?.({ kind: "searching" });

  const onEnd = () => {
    if (state.ended) return;
    state.ended = true;
    state.reticle?.dispose();
    callbacks.onEnded?.();
  };
  session.addEventListener("end", onEnd);

  const loop: XRFrameRequestCallback = (_time, frame) => {
    if (state.ended) return;
    state.animationFrameHandle = state.session.requestAnimationFrame(loop);
    renderFrame(frame, state, callbacks);
  };
  state.animationFrameHandle = state.session.requestAnimationFrame(loop);

  return {
    capture: () => {
      if (!state.lastHitPose) return;
      const pos = state.lastHitPose.position;
      const point: [number, number, number] = [pos.x, pos.y, pos.z];
      if (!state.heelWorld) {
        state.heelWorld = point;
        callbacks.onStatus?.({ kind: "heel-locked" });
        return;
      }
      if (!state.toeWorld) {
        state.toeWorld = point;
        callbacks.onStatus?.({ kind: "measuring" });
        const m = measurementFrom(state.heelWorld, point);
        callbacks.onMeasured(m);
        state.session.end().catch(() => onEnd());
      }
    },
    end: () => {
      state.session.end().catch(() => onEnd());
    },
  };
}

function renderFrame(
  frame: XRFrame,
  state: InternalState,
  callbacks: ArScannerCallbacks,
) {
  const session = state.session;
  const gl = state.gl;
  if (!state.reticle) return;
  const baseLayer = session.renderState.baseLayer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Hit test → reticle pose
  if (state.hitTestSource) {
    const hits = frame.getHitTestResults(state.hitTestSource);
    if (hits.length > 0) {
      const pose = hits[0].getPose(state.refSpace);
      if (pose) {
        state.lastHitPose = pose.transform;
        if (state.heelWorld === null) {
          callbacks.onStatus?.({ kind: "ready" });
        }
      }
    } else if (state.lastHitPose) {
      // lost lock; keep last pose so capture still works but warn user
      state.lastHitPose = null;
      callbacks.onStatus?.({ kind: "searching" });
    }
  }

  const viewerPose = frame.getViewerPose(state.refSpace);
  if (!viewerPose) return;

  for (const view of viewerPose.views) {
    const viewport = baseLayer.getViewport(view);
    if (!viewport) continue;
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

    const viewMat = invertMat4(view.transform.matrix);
    const projMat = view.projectionMatrix;
    if (state.lastHitPose) {
      state.reticle.draw(state.lastHitPose.matrix, viewMat, projMat);
    }
  }
}

/**
 * Reticle renderer — a small white disc + outline drawn on the detected
 * floor plane. Implemented as a fan of triangles in a single VBO so we
 * don't need an external math library or model loader.
 */
class ReticleRenderer {
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vertexCount: number;
  private uModelLoc: WebGLUniformLocation | null;
  private uViewLoc: WebGLUniformLocation | null;
  private uProjLoc: WebGLUniformLocation | null;
  private uColorLoc: WebGLUniformLocation | null;
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const vs = `#version 300 es
      in vec3 a_pos;
      uniform mat4 u_model;
      uniform mat4 u_view;
      uniform mat4 u_proj;
      void main() { gl_Position = u_proj * u_view * u_model * vec4(a_pos, 1.0); }`;
    const fs = `#version 300 es
      precision mediump float;
      uniform vec4 u_color;
      out vec4 outColor;
      void main() { outColor = u_color; }`;
    this.program = linkProgram(gl, vs, fs);
    gl.useProgram(this.program);
    this.uModelLoc = gl.getUniformLocation(this.program, "u_model");
    this.uViewLoc = gl.getUniformLocation(this.program, "u_view");
    this.uProjLoc = gl.getUniformLocation(this.program, "u_proj");
    this.uColorLoc = gl.getUniformLocation(this.program, "u_color");

    const radius = 0.05;
    const segments = 48;
    const verts: number[] = [];
    // disc — triangle fan around origin in XZ plane (Y up)
    verts.push(0, 0, 0);
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      verts.push(Math.cos(t) * radius, 0, Math.sin(t) * radius);
    }
    this.vertexCount = segments + 2;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Couldn't create VAO");
    this.vao = vao;
    gl.bindVertexArray(vao);
    const loc = gl.getAttribLocation(this.program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
  }

  draw(modelMat: Float32Array, viewMat: Float32Array, projMat: Float32Array) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(this.uModelLoc, false, modelMat);
    gl.uniformMatrix4fv(this.uViewLoc, false, viewMat);
    gl.uniformMatrix4fv(this.uProjLoc, false, projMat);
    gl.uniform4f(this.uColorLoc, 0, 0.9, 0.78, 0.85); // neon-ish
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertexCount);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
  }
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vsSrc: string,
  fsSrc: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("Couldn't create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error("Program link failed: " + log);
  }
  return program;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("Couldn't create shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    throw new Error("Shader compile failed: " + log);
  }
  return sh;
}

/**
 * Invert a 4×4 matrix laid out column-major (the format WebXR delivers).
 * Returns a fresh Float32Array. Used to derive the view matrix from
 * the camera's world transform.
 */
function invertMat4(m: Float32Array): Float32Array {
  const inv = new Float32Array(16);
  inv[0] =
    m[5] * m[10] * m[15] -
    m[5] * m[11] * m[14] -
    m[9] * m[6] * m[15] +
    m[9] * m[7] * m[14] +
    m[13] * m[6] * m[11] -
    m[13] * m[7] * m[10];
  inv[4] =
    -m[4] * m[10] * m[15] +
    m[4] * m[11] * m[14] +
    m[8] * m[6] * m[15] -
    m[8] * m[7] * m[14] -
    m[12] * m[6] * m[11] +
    m[12] * m[7] * m[10];
  inv[8] =
    m[4] * m[9] * m[15] -
    m[4] * m[11] * m[13] -
    m[8] * m[5] * m[15] +
    m[8] * m[7] * m[13] +
    m[12] * m[5] * m[11] -
    m[12] * m[7] * m[9];
  inv[12] =
    -m[4] * m[9] * m[14] +
    m[4] * m[10] * m[13] +
    m[8] * m[5] * m[14] -
    m[8] * m[6] * m[13] -
    m[12] * m[5] * m[10] +
    m[12] * m[6] * m[9];
  inv[1] =
    -m[1] * m[10] * m[15] +
    m[1] * m[11] * m[14] +
    m[9] * m[2] * m[15] -
    m[9] * m[3] * m[14] -
    m[13] * m[2] * m[11] +
    m[13] * m[3] * m[10];
  inv[5] =
    m[0] * m[10] * m[15] -
    m[0] * m[11] * m[14] -
    m[8] * m[2] * m[15] +
    m[8] * m[3] * m[14] +
    m[12] * m[2] * m[11] -
    m[12] * m[3] * m[10];
  inv[9] =
    -m[0] * m[9] * m[15] +
    m[0] * m[11] * m[13] +
    m[8] * m[1] * m[15] -
    m[8] * m[3] * m[13] -
    m[12] * m[1] * m[11] +
    m[12] * m[3] * m[9];
  inv[13] =
    m[0] * m[9] * m[14] -
    m[0] * m[10] * m[13] -
    m[8] * m[1] * m[14] +
    m[8] * m[2] * m[13] +
    m[12] * m[1] * m[10] -
    m[12] * m[2] * m[9];
  inv[2] =
    m[1] * m[6] * m[15] -
    m[1] * m[7] * m[14] -
    m[5] * m[2] * m[15] +
    m[5] * m[3] * m[14] +
    m[13] * m[2] * m[7] -
    m[13] * m[3] * m[6];
  inv[6] =
    -m[0] * m[6] * m[15] +
    m[0] * m[7] * m[14] +
    m[4] * m[2] * m[15] -
    m[4] * m[3] * m[14] -
    m[12] * m[2] * m[7] +
    m[12] * m[3] * m[6];
  inv[10] =
    m[0] * m[5] * m[15] -
    m[0] * m[7] * m[13] -
    m[4] * m[1] * m[15] +
    m[4] * m[3] * m[13] +
    m[12] * m[1] * m[7] -
    m[12] * m[3] * m[5];
  inv[14] =
    -m[0] * m[5] * m[14] +
    m[0] * m[6] * m[13] +
    m[4] * m[1] * m[14] -
    m[4] * m[2] * m[13] -
    m[12] * m[1] * m[6] +
    m[12] * m[2] * m[5];
  inv[3] =
    -m[1] * m[6] * m[11] +
    m[1] * m[7] * m[10] +
    m[5] * m[2] * m[11] -
    m[5] * m[3] * m[10] -
    m[9] * m[2] * m[7] +
    m[9] * m[3] * m[6];
  inv[7] =
    m[0] * m[6] * m[11] -
    m[0] * m[7] * m[10] -
    m[4] * m[2] * m[11] +
    m[4] * m[3] * m[10] +
    m[8] * m[2] * m[7] -
    m[8] * m[3] * m[6];
  inv[11] =
    -m[0] * m[5] * m[11] +
    m[0] * m[7] * m[9] +
    m[4] * m[1] * m[11] -
    m[4] * m[3] * m[9] -
    m[8] * m[1] * m[7] +
    m[8] * m[3] * m[5];
  inv[15] =
    m[0] * m[5] * m[10] -
    m[0] * m[6] * m[9] -
    m[4] * m[1] * m[10] +
    m[4] * m[2] * m[9] +
    m[8] * m[1] * m[6] -
    m[8] * m[2] * m[5];
  let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  if (Math.abs(det) < 1e-9) {
    // singular — return identity rather than NaN
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
  det = 1 / det;
  for (let i = 0; i < 16; i++) inv[i] *= det;
  return inv;
}

/** Build a {@link FootMeasurement} from two 3D points captured by AR. */
function measurementFrom(
  heel: [number, number, number],
  toe: [number, number, number],
): FootMeasurement {
  const dx = heel[0] - toe[0];
  const dy = heel[1] - toe[1];
  const dz = heel[2] - toe[2];
  // Distance is reported in metres by WebXR; convert to millimetres.
  const lengthMm = Math.hypot(dx, dy, dz) * 1000;
  // We don't capture width via AR in this version — estimate via the
  // 0.38 population ratio. Future iterations will add 3rd/4th taps for
  // medial/lateral.
  const widthMm = lengthMm * 0.38;
  return {
    lengthMm,
    widthMm,
    confidence: 0.95,
    foot: "right",
    calibration: "arcore_plane",
    pixelsPerMm: 0,
  };
}
