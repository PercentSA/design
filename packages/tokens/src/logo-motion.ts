// The loader loop (spec docs/brand-remake.md D4, D5): the Portal motion between the icon and each wordmark,
// ported from docs/brand/portal-loader.html. Pure: a frame is a function of time, so the component, tests
// and video renders sample the same frames.
import { LOGO_ARABIC, LOGO_ENGLISH, LOGO_ICON, LOGO_LINE_Y, LOGO_STROKE, quadPath, type Quad } from "./logo";

type Q = readonly number[]; // 8 numbers, as Quad
type Group = "main" | "left" | "right";
type Shape = { group: Group; kf: [number, Q][] }; // keyframes in u: 0 = logo, 1 = word
type Def = { shapes: Record<string, Shape>; gap: number; wordCx: number };
type Track = { group: Group; ts: number[]; comps: number[][]; slopes: number[][] };

// Same constants as logo.ts.
const E = LOGO_STROKE / 2, H = 221.2, YC = LOGO_LINE_Y, RUN = 158 / 221.2, COS = 1 / Math.hypot(1, RUN), XT = YC * RUN;
const SW0 = (28.5 - LOGO_STROKE) / COS; // path width of the word slash (the ر and the c stem)
const LOGO_CX = -0.15; // the icon's visible centre
const f2 = (n: number) => n.toFixed(2);

const slashQ = (w: number): Q => [XT - w / 2, 0, XT + w / 2, 0, -XT + w / 2, H, -XT - w / 2, H];
const shift = (q: Q, dx: number, dy = 0): Q => q.map((v, i) => (i % 2 ? v + dy : v + dx));
const area = (q: Q) => Math.abs(q[0]! * q[3]! - q[2]! * q[1]! + (q[2]! * q[5]! - q[4]! * q[3]!) + (q[4]! * q[7]! - q[6]! * q[5]!) + (q[6]! * q[1]! - q[0]! * q[7]!)) / 2;
const pathBox = (qs: readonly Q[]) => {
  const xs = qs.flatMap((q) => [q[0]!, q[2]!, q[4]!, q[6]!]);
  return [Math.min(...xs), Math.max(...xs)] as const;
};
const centreX = (qs: readonly Q[]) => (pathBox(qs)[0] + pathBox(qs)[1]) / 2;
/** The quad folded onto its left edge (zero area: not drawn). */
const foldLeft = (q: Q): Q => [q[0]!, q[1]!, q[0]!, q[1]!, q[6]!, q[7]!, q[6]!, q[7]!];
const grow = (q: Q, u0: number, u1: number): [number, Q][] => [[0, foldLeft(q)], [u0, foldLeft(q)], [u1, q]];
/** Out of the slash with a 9-unit overshoot. */
const slideIn = (q: Q, d: number, delay = 0): [number, Q][] => [[0, shift(q, d)], [0.36 + delay, shift(q, d)], [0.86, shift(q, -Math.sign(d) * 9)], [1, q]];

const LOGO: Q = LOGO_ICON.slash;
// The squares slide into the slash (each is clipped on the far side of its edge).
const through = (): Record<string, Shape> => ({
  sqL: { group: "left", kf: [[0, LOGO_ICON.tl], [0.34, shift(LOGO_ICON.tl, 175, 165)]] },
  sqR: { group: "right", kf: [[0, LOGO_ICON.br], [0.34, shift(LOGO_ICON.br, -175, -165)]] },
});

const A = LOGO_ARABIC;
const P_AR: Def = {
  gap: 0,
  wordCx: centreX(Object.values(A)),
  shapes: {
    slash: { group: "main", kf: [[0, LOGO], [0.3, slashQ(SW0)], [0.42, A.slash]] },
    ...through(),
    lb: { group: "left", kf: slideIn(A.lb, 430) },
    tu: { group: "left", kf: slideIn(A.tu, 430, 0.04) },
    nt: { group: "left", kf: slideIn(A.nt, 430, 0.03) },
    nd: { group: "left", kf: slideIn(A.nd, 430, 0.05) },
    td1: { group: "left", kf: slideIn(A.td1, 430, 0.07) },
    td2: { group: "left", kf: slideIn(A.td2, 430, 0.07) },
    bb: { group: "right", kf: slideIn(A.bb, -270) },
    bd: { group: "right", kf: slideIn(A.bd, -270, 0.05) },
  },
};

const N = LOGO_ENGLISH;
const P_EN: Def = (() => {
  const dL = 90 - pathBox(N.left)[0], dR = -90 - pathBox(N.right)[1];
  const shapes: Record<string, Shape> = {
    slash: { group: "main", kf: [[0, LOGO], [0.3, slashQ(SW0)], [0.42, N.stem]] },
    ...through(),
    armT: { group: "main", kf: grow(N.armT, 0.7, 0.86) }, // the arms last: the letters slide out past the bare stem
    armB: { group: "main", kf: grow(N.armB, 0.72, 0.88) },
  };
  N.left.forEach((q, i) => (shapes[`L${i}`] = { group: "left", kf: slideIn(q, dL) }));
  N.right.forEach((q, i) => (shapes[`R${i}`] = { group: "right", kf: slideIn(q, dR) }));
  return { gap: E / COS + 6, wordCx: centreX([N.stem, N.armT, N.armB, ...N.left, ...N.right]), shapes };
})();

/** u keyframes → t keyframes (t = 1 − u), sorted, one per time, from 0 to 1; then monotone cubic slopes (Fritsch–Butland, flat ends). */
function track({ group, kf }: Shape): Track {
  const pts: [number, Q][] = [];
  for (const [t, q] of kf.map(([u, q]) => [1 - u, q] as [number, Q]).sort((a, b) => a[0] - b[0])) {
    if (pts.length && Math.abs(pts[pts.length - 1]![0] - t) < 1e-6) pts[pts.length - 1] = [t, q];
    else pts.push([t, q]);
  }
  if (pts[0]![0] > 0) pts.unshift([0, pts[0]![1]]);
  if (pts[pts.length - 1]![0] < 1) pts.push([1, pts[pts.length - 1]![1]]);
  const ts = pts.map((p) => p[0]);
  const comps = Array.from({ length: 8 }, (_, c) => pts.map((p) => p[1][c]!));
  const slopes = comps.map((vs) => {
    const m = new Array<number>(ts.length).fill(0);
    for (let k = 1; k < ts.length - 1; k++) {
      const h0 = ts[k]! - ts[k - 1]!, h1 = ts[k + 1]! - ts[k]!;
      const d0 = (vs[k]! - vs[k - 1]!) / h0, d1 = (vs[k + 1]! - vs[k]!) / h1;
      m[k] = d0 * d1 <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
    }
    return m;
  });
  return { group, ts, comps, slopes };
}
function at({ ts, comps, slopes }: Track, t: number): Q {
  const n = ts.length;
  if (t <= ts[0]!) return comps.map((v) => v[0]!);
  if (t >= ts[n - 1]!) return comps.map((v) => v[n - 1]!);
  let i = 0;
  while (t > ts[i + 1]!) i++;
  const h = ts[i + 1]! - ts[i]!, s = (t - ts[i]!) / h, s2 = s * s, s3 = s2 * s;
  return comps.map((v, c) => (2 * s3 - 3 * s2 + 1) * v[i]! + (s3 - 2 * s2 + s) * h * slopes[c]![i]! + (-2 * s3 + 3 * s2) * v[i + 1]! + (s3 - s2) * h * slopes[c]![i + 1]!);
}

const TRACKS = { ar: P_AR, en: P_EN } as const;
const COMPILED = {
  ar: Object.values(P_AR.shapes).map(track),
  en: Object.values(P_EN.shapes).map(track),
};

/** The loop; t: 1 = logo, 0 = word. */
export const LOADER_STAGES: readonly { word: "ar" | "en"; from: 0 | 1; to: 0 | 1; ms: number }[] = [
  { word: "ar", from: 1, to: 1, ms: 400 },
  { word: "ar", from: 1, to: 0, ms: 1200 },
  { word: "ar", from: 0, to: 0, ms: 800 },
  { word: "ar", from: 0, to: 1, ms: 1200 },
  { word: "en", from: 1, to: 1, ms: 400 },
  { word: "en", from: 1, to: 0, ms: 1200 },
  { word: "en", from: 0, to: 0, ms: 800 },
  { word: "en", from: 0, to: 1, ms: 1200 },
];
export const LOADER_LOOP_MS = LOADER_STAGES.reduce((a, s) => a + s.ms, 0);
/** Holds every stage, so the box never changes size. */
export const LOADER_VIEWBOX: readonly [number, number, number, number] = [-400, -40, 800, 300];

/** One frame: paths by clip group, the clip polygons and the camera's x move. */
export type LoaderFrame = { stage: number; camera: number; main: string[]; left: string[]; right: string[]; clipLeft: string; clipRight: string };

/** The line through one edge of the slash (left edge for left parts, right edge for right parts), moved out by the gap: its x at y. */
function edgeX(slash: Q, side: "left" | "right", gap: number) {
  const [ax, ay, bx, by] = side === "left" ? [slash[0]! - gap, slash[1]!, slash[6]! - gap, slash[7]!] : [slash[2]! + gap, slash[3]!, slash[4]! + gap, slash[5]!];
  return (y: number) => ax + ((y - ay) * (bx - ax)) / (by - ay || 1e-6);
}
/** Left parts show only left of the left edge line, right parts only right of the right edge line: they pass through the slash. */
function clip(x: (y: number) => number, side: "left" | "right") {
  return side === "left" ? `-3000,-800 ${f2(x(-800))},-800 ${f2(x(1100))},1100 -3000,1100` : `${f2(x(-800))},-800 3000,-800 3000,1100 ${f2(x(1100))},1100`;
}
/** Every visible corner on the hidden side of its line: the part is out of sight. */
function hidden(q: Q, x: (y: number) => number, side: "left" | "right") {
  for (let i = 0; i < 8; i += 2)
    for (const dy of [-E, E]) {
      const lx = x(q[i + 1]! + dy);
      if (side === "left" ? q[i]! - E < lx : q[i]! + E > lx) return false;
    }
  return true;
}

export function logoLoaderFrame(ms: number): LoaderFrame {
  let m = ((ms % LOADER_LOOP_MS) + LOADER_LOOP_MS) % LOADER_LOOP_MS, i = 0;
  while (i < LOADER_STAGES.length - 1 && m >= LOADER_STAGES[i]!.ms) m -= LOADER_STAGES[i++]!.ms;
  const st = LOADER_STAGES[i]!, t = st.from + (st.to - st.from) * Math.min(1, m / st.ms);
  const def = TRACKS[st.word], tracks = COMPILED[st.word];
  const qs = tracks.map((tr) => at(tr, t));
  const slash = qs[0]!; // the first shape is the slash
  const xl = edgeX(slash, "left", def.gap), xr = edgeX(slash, "right", def.gap);
  const out: Record<Group, string[]> = { main: [], left: [], right: [] };
  tracks.forEach((tr, k) => {
    const q = qs[k]!;
    if (area(q) < 1) return; // folded flat: not drawn (the stroke would show a line)
    if (tr.group === "left" && hidden(q, xl, "left")) return;
    if (tr.group === "right" && hidden(q, xr, "right")) return;
    out[tr.group].push(quadPath(q as Quad));
  });
  const ease = t * t * (3 - 2 * t);
  return { stage: i, camera: -(def.wordCx + (LOGO_CX - def.wordCx) * ease), ...out, clipLeft: clip(xl, "left"), clipRight: clip(xr, "right") };
}
