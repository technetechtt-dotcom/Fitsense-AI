/**
 * 2D projective homography solver.
 *
 * Given 4 corresponding image-space and world-space points lying on the
 * same plane, computes a 3x3 matrix H such that:
 *
 *     [X·w]       [x]
 *     [Y·w]  =  H·[y]
 *     [  w]       [1]
 *
 * Used by the FitSense scanner to convert pixel coordinates in a captured
 * frame into real-world millimetres, with a known-dimensions reference
 * object (A4 paper or ID-1 bank card) placed on the same plane as the foot.
 *
 * Implementation: Direct Linear Transform (DLT) with h₃₃ fixed to 1 →
 * 8 linear equations in 8 unknowns, solved by Gauss–Jordan elimination
 * with partial pivoting. Stable enough for our well-conditioned 4-point
 * problem; no SVD dependency required.
 */

export interface Point {
  x: number;
  y: number;
}

export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/**
 * Compute the homography H mapping `src` (image px) → `dst` (world mm).
 * Both arrays must contain exactly 4 corresponding points.
 *
 * Throws if the system is singular (e.g. three or more colinear points).
 */
export function computeHomography(src: Point[], dst: Point[]): Mat3 {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error("computeHomography needs exactly 4 correspondences");
  }
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }
  const h = solveLinearSystem(A, b);
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

/** Apply a homography to a single image-space point, returning world-space. */
export function applyHomography(H: Mat3, p: Point): Point {
  const w = H[2][0] * p.x + H[2][1] * p.y + H[2][2];
  return {
    x: (H[0][0] * p.x + H[0][1] * p.y + H[0][2]) / w,
    y: (H[1][0] * p.x + H[1][1] * p.y + H[1][2]) / w,
  };
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Solve A·x = b via Gauss–Jordan elimination with partial pivoting.
 * Mutates a copy of A/b internally; throws if the system is singular.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    // partial pivot on column i
    let pivotRow = i;
    let pivotAbs = Math.abs(M[i][i]);
    for (let j = i + 1; j < n; j++) {
      const a = Math.abs(M[j][i]);
      if (a > pivotAbs) {
        pivotAbs = a;
        pivotRow = j;
      }
    }
    if (pivotAbs < 1e-12) {
      throw new Error("Singular system — points may be colinear");
    }
    if (pivotRow !== i) [M[i], M[pivotRow]] = [M[pivotRow], M[i]];
    const div = M[i][i];
    for (let k = 0; k <= n; k++) M[i][k] /= div;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const factor = M[j][i];
      if (factor === 0) continue;
      for (let k = 0; k <= n; k++) M[j][k] -= factor * M[i][k];
    }
  }
  return M.map((row) => row[n]);
}

/**
 * Sort 4 image-space points into a stable TL → TR → BR → BL order so
 * downstream callers don't need to ask the user to tap in a specific
 * sequence. We use the standard centroid-based corner sort:
 *
 *  - centroid c = mean(points)
 *  - for each p: angle = atan2(p.y - c.y, p.x - c.x)
 *  - sort by angle (counter-clockwise from -π) → BL, BR, TR, TL
 *  - rotate so the first entry is the top-left (smallest x+y)
 */
export function sortCornersTL(points: Point[]): Point[] {
  if (points.length !== 4) return points.slice();
  const cx = points.reduce((s, p) => s + p.x, 0) / 4;
  const cy = points.reduce((s, p) => s + p.y, 0) / 4;
  const annotated = points
    .map((p) => ({ p, a: Math.atan2(p.y - cy, p.x - cx) }))
    .sort((a, b) => a.a - b.a)
    .map((e) => e.p);
  let tlIdx = 0;
  let tlScore = annotated[0].x + annotated[0].y;
  for (let i = 1; i < 4; i++) {
    const s = annotated[i].x + annotated[i].y;
    if (s < tlScore) {
      tlScore = s;
      tlIdx = i;
    }
  }
  return [
    annotated[tlIdx],
    annotated[(tlIdx + 1) % 4],
    annotated[(tlIdx + 2) % 4],
    annotated[(tlIdx + 3) % 4],
  ];
}
