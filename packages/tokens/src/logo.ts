// The Percent logo: the icon, the Arabic and English wordmarks and the 7 versions, built from one set of sizes
// (LOGO_SIZES: the grid, 1 square = 100 units). LOGO_SIZES_0_5 keeps the sizes of 0.5 for a rollback.
// Spec docs/brand-remake.md. Every logo comes from here: never redraw it.

/** Four corners (top-left, top-right, bottom-right, bottom-left) as x, y. Drawn with fill and a round-join stroke of LOGO_STROKE. */
export type Quad = readonly [number, number, number, number, number, number, number, number];
type Pt = [number, number];
type Box = [number, number, number, number];

/** Every size of one logo geometry. Lengths are logo units; the shapes are paths drawn with a round-join stroke. */
export type LogoSizes = {
  /** The round-join stroke of every path: half of it rounds the corners. */
  stroke: number;
  /** The slash angle: x across per unit of height. It never mirrors. */
  run: number;
  /** The line: the middle of the icon. Every part of a row is centred on it. */
  line: number;
  /** The space between the parts of a version, and the clear space. */
  gap: number;
  /** A visible icon square. In the stacked version each word's x-height is this high. */
  square: number;
  /** The icon's path quads, its slash centred on x = 0. */
  icon: { tl: Quad; br: Quad; slash: Quad };
  /**
   * stroke; left: the long line left of the ر (سنت); ba: the ب bar right of it; gap: after the ر;
   * dot, dotGap, tooth: × stroke; nPos, tPos: the ن tooth and the ت dots, × the long line from its right end; raH: the ر height.
   */
  arabic: { stroke: number; left: number; ba: number; gap: number; dot: number; dotGap: number; tooth: number; nPos: number; tPos: number; raH: number };
  /** xh: x-height; w: letter width; g: letter gap; asc, desc: × xh; the other values shape the c, r, e and t. The stroke is the Arabic stroke. */
  english: { xh: number; w: number; g: number; asc: number; desc: number; cArm: number; rcGap: number; ceGap: number; rArm: number; eBar: number; tW: number; tStem: number };
  /** The loader: slide distances of the Arabic parts, the icon squares and the English letters, the overshoot, the clip gap and the view box. */
  loader: { arL: number; arR: number; squares: readonly [number, number]; over: number; enEdge: number; clipGap: number; viewBox: readonly [number, number, number, number] };
};

const quad = (v: number[]) => v as unknown as Quad;
const flat = (pts: Pt[]) => quad(pts.flat());
const f2 = (n: number) => n.toFixed(2);

/** Moves every edge in by e (the path is drawn with a stroke of 2e). */
function inset(q: Pt[], e: number): Pt[] {
  const lines = q.map((a, i) => {
    const b = q[(i + 1) % 4]!, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return { p: [a[0] - (dy / l) * e, a[1] + (dx / l) * e] as Pt, d: [dx, dy] as Pt };
  });
  return lines.map((l2, i) => {
    const l1 = lines[(i + 3) % 4]!, cr = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
    if (Math.abs(cr) < 1e-9) return l2.p;
    const t = ((l2.p[0] - l1.p[0]) * l2.d[1] - (l2.p[1] - l1.p[1]) * l2.d[0]) / cr;
    return [l1.p[0] + l1.d[0] * t, l1.p[1] + l1.d[1] * t];
  });
}

/** The visible corners of a grid shape, as a path inset by half the stroke 8. */
const cells = (...v: number[]) => flat(inset([[v[0]!, v[1]!], [v[2]!, v[3]!], [v[4]!, v[5]!], [v[6]!, v[7]!]], 4));

/**
 * The grid (from 0.6): 1 square = 100 visible units. The icon is 3 × 3 squares; its slash joins the top-right and
 * bottom-left cells (2 across for 3 down). x-height 2 squares, ascender and descender half a square each, so the
 * English word is as high as the icon. Stroke and dots 40. The Arabic word is as wide as the English: ب bar 320,
 * س 450 (the ر gap to the ن tooth), ن to the ت dots 150, ت dots to the line end 130.
 */
export const LOGO_SIZES: LogoSizes = {
  stroke: 8,
  run: 2 / 3,
  line: 150,
  gap: 100,
  square: 100,
  icon: {
    tl: cells(-150, 0, -50, 0, -50, 100, -150, 100),
    br: cells(50, 200, 150, 200, 150, 300, 50, 300),
    slash: cells(50, 0, 150, 0, -50, 300, -150, 300),
  },
  arabic: { stroke: 40, left: 730, ba: 320, gap: 20, dot: 1, dotGap: 1, tooth: 0.5, nPos: 450 / 730, tPos: 600 / 730, raH: 200 },
  english: { xh: 200, w: 150, g: 20, asc: 0.25, desc: 0.25, cArm: 80 / 150, rcGap: -20, ceGap: 60, rArm: 130 / 150, eBar: 0.5, tW: 100 / 150, tStem: 1 / 3 },
  loader: { arL: 925, arR: -467, squares: [226, 213], over: 13, enEdge: 129, clipGap: 9, viewBox: [-620, -50, 1240, 400] },
};

// The 0.5 <Mark> path (230 × 221.2), shifted so its slash is centred on x = 0.
const mark05 = (...v: number[]) => quad(v.map((n, i) => (i % 2 ? n : n - 115.15)));
/** The sizes of 0.5 (docs/brand/*.json). To roll back: build LOGO from these, and put back MARK_* (ui) and SLASH_RUN (tokens, motion) of 0.5.1. */
export const LOGO_SIZES_0_5: LogoSizes = {
  stroke: 6.63,
  run: 158 / 221.2,
  line: 110.6,
  gap: 70.8,
  square: 70.8 + 6.63,
  icon: {
    tl: mark05(0, 0, 70.8, 0, 70.8, 70.8, 0, 70.8),
    br: mark05(159.2, 150.4, 230, 150.4, 230, 221.2, 159.2, 221.2),
    slash: mark05(160.3, 0, 228, 0, 70.3, 221.2, 2, 221.2),
  },
  arabic: { stroke: 28.5, left: 332, ba: 180, gap: 11.5, dot: 1.15, dotGap: 0.95, tooth: 0.55, nPos: 0.41, tPos: 0.72, raH: 140 },
  english: { xh: 140, w: 102, g: 12, asc: 0.35, desc: 0.35, cArm: 0.5, rcGap: -15, ceGap: 45, rArm: 0.86, eBar: 0.52, tW: 0.67, tStem: 0.4 },
  loader: { arL: 430, arR: -270, squares: [175, 165], over: 9, enEdge: 90, clipGap: 6, viewBox: [-400, -40, 800, 300] },
};

const RQ = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
function hb(x0: number, x1: number, y0: number, y1: number, runL = 0, runR = 0): Pt[] {
  const yc = (y0 + y1) / 2, Lx = (y: number) => x0 + (yc - y) * runL, Rx = (y: number) => x1 + (yc - y) * runR;
  return [[Lx(y0), y0], [Rx(y0), y0], [Rx(y1), y1], [Lx(y1), y1]];
}

/** SVG path data of a quad, numbers with 2 decimals. */
export const quadPath = (q: Quad) => `M${f2(q[0])} ${f2(q[1])}L${f2(q[2])} ${f2(q[3])}L${f2(q[4])} ${f2(q[5])}L${f2(q[6])} ${f2(q[7])}Z`;

// ---------- The 7 versions (spec §4.5) ----------
export type LogoVersion = "icon" | "en" | "ar" | "icon-en" | "icon-ar" | "row" | "stack";
export const LOGO_VERSIONS: readonly LogoVersion[] = ["icon", "en", "ar", "icon-en", "icon-ar", "row", "stack"];
/** One placed part: its path data, its transform (none when it stays in place) and its visible box after the transform. */
export type LogoPart = { d: string; transform?: string; box: Box };

/** The icon, both words, their visible boxes and the 7 versions, from one set of sizes. */
export function buildLogo(z: LogoSizes) {
  const E = z.stroke / 2, YC = z.line, RUN = z.run, COS = 1 / Math.hypot(1, RUN), XT = YC * RUN;

  /** A bar of path corners; an end cut "slash" follows the slash angle. */
  function bar(x0: number, x1: number, y0: number, y1: number, cutL: "straight" | "slash", cutR: "straight" | "slash") {
    const yt = y0 + E, yb = y1 - E, yc = (y0 + y1) / 2;
    const L = (y: number) => (cutL === "slash" ? x0 + E / COS + (yc - y) * RUN : x0 + E);
    const R = (y: number) => (cutR === "slash" ? x1 - E / COS + (yc - y) * RUN : x1 - E);
    return flat([[L(yt), yt], [R(yt), yt], [R(yb), yb], [L(yb), yb]]);
  }
  const tooth = (xc: number, y0: number, y1: number, s: number) => flat([[xc - s / 2 + E, y0 + E], [xc + s / 2 - E, y0 + E], [xc + s / 2 - E, y1 - E], [xc - s / 2 + E, y1 - E]]);
  const sq = (x: number, y: number, d: number) => flat([[x + E, y + E], [x + d - E, y + E], [x + d - E, y + d - E], [x + E, y + d - E]]);
  /** A slash of path width w, cut to visible height h, centred on the line. */
  function slashCut(w: number, h: number) {
    const y0 = YC - h / 2 + E, y1 = YC + h / 2 - E, x = (y: number) => XT - y * RUN;
    return quad([x(y0) - w / 2, y0, x(y0) + w / 2, y0, x(y1) + w / 2, y1, x(y1) - w / 2, y1]);
  }
  const shear = (q: Pt[], k: number): Pt[] => q.map(([x, y]) => [x + (YC - y) * k * RUN, y]);

  const AR = z.arabic;
  const arabic = (() => {
    const s = AR.stroke, d = AR.dot * s, dg = AR.dotGap * s, th = AR.tooth * s, yT = YC - s / 2, yB = YC + s / 2, wv = s / COS;
    const xbR = wv / 2 + AR.ba, xlR = -wv / 2 - AR.gap, xlL = xlR - AR.left, nx = xlR - AR.nPos * AR.left, tx = xlR - AR.tPos * AR.left, dd = 0.3 * d;
    return {
      slash: slashCut((s - z.stroke) / COS, AR.raH),
      bb: bar(0, xbR, yT, yB, "straight", "slash"),
      bd: sq(xbR - (s / 2) * RUN - d, YC + AR.raH / 2 - d, d), // its bottom on the ر's bottom
      lb: bar(xlL, xlR, yT, yB, "straight", "slash"),
      tu: tooth(xlL + s / 2, yT - th, yB, s),
      nt: tooth(nx, yT - th, yB, s),
      nd: sq(nx - d / 2, yT - th - dg - d, d),
      td1: sq(tx - dd / 2 - d, yT - dg - d, d),
      td2: sq(tx + dd / 2, yT - dg - d, d),
    };
  })();

  const english = (() => {
    const p = z.english, s = AR.stroke, top = YC - p.xh / 2, bot = YC + p.xh / 2, w = p.w, left: Pt[][] = [], right: Pt[][] = [];
    const c: { stem?: Pt[]; top?: Pt[]; bot?: Pt[] } = {};
    let x = 0, cMid = 0, side = left;
    const letter = (ch: string) => {
      const k = ch === "c" ? 1 : 0, sx = s * Math.hypot(1, k * RUN), cr = RUN * (1 - k), q: Pt[][] = [];
      let adv = 0;
      if (ch === "p") { q.push(RQ(x, top, x + sx, bot + p.desc * p.xh), RQ(x, top, x + w, top + s), RQ(x + w - sx, top, x + w, bot), RQ(x, bot - s, x + w, bot)); adv = w; }
      if (ch === "e") {
        const ym = top + p.eBar * (p.xh - s);
        q.push(RQ(x, top, x + w, top + s), RQ(x, top, x + sx, bot), hb(x, x + w, bot - s, bot, 0, cr), RQ(x, ym, x + w, ym + s), RQ(x + w - sx, top, x + w, ym + s));
        adv = w;
      }
      if (ch === "r") { const rw = p.rArm * w; q.push(RQ(x, top, x + sx, bot), hb(x, x + rw, top, top + s, 0, cr)); adv = rw; }
      if (ch === "n") { q.push(RQ(x, top, x + sx, bot), RQ(x, top, x + w, top + s), RQ(x + w - sx, top, x + w, bot)); adv = w; }
      if (ch === "t") {
        const tw = p.tW * w, st = x + (tw - sx) * p.tStem;
        q.push(hb(x, x + tw, top, top + s, cr, cr), RQ(st, top - p.asc * p.xh, st + sx, bot), hb(st, x + tw, bot - s, bot, 0, cr));
        adv = tw;
      }
      if (ch === "c") {
        // The c is the slash: its stem and arms are sheared to the slash angle.
        const arm = p.cArm * w;
        c.stem = shear(RQ(x, top, x + sx, bot), 1);
        c.top = shear(hb(x, x + sx + arm, top, top + s, 0, cr), 1);
        c.bot = shear(hb(x, x + sx + arm, bot - s, bot, 0, cr), 1);
        cMid = x + sx / 2;
        side = right;
        return sx + arm;
      }
      side.push(...q);
      return adv;
    };
    [..."percent"].forEach((ch, i, all) => {
      if (ch === "c") x += p.rcGap;
      x += letter(ch);
      if (ch === "c") x += p.ceGap;
      if (i < all.length - 1) x += p.g;
    });
    const fix = (q: Pt[]) => flat(inset(q.map(([qx, qy]) => [qx - cMid, qy]), E)); // centred on the c
    return { left: left.map(fix), right: right.map(fix), stem: fix(c.stem!), armT: fix(c.top!), armB: fix(c.bot!) };
  })();

  /** What you see of some quads: their path bounds plus half the stroke. */
  function visibleBox(qs: readonly Quad[]): Box {
    const xs = qs.flatMap((q) => [q[0], q[2], q[4], q[6]]), ys = qs.flatMap((q) => [q[1], q[3], q[5], q[7]]);
    return [Math.min(...xs) - E, Math.min(...ys) - E, Math.max(...xs) + E, Math.max(...ys) + E];
  }

  const ICON_Q = [z.icon.tl, z.icon.br, z.icon.slash];
  const AR_Q = Object.values(arabic);
  const EN_Q = [english.stem, english.armT, english.armB, ...english.left, ...english.right];

  type Piece = { qs: readonly Quad[]; s: number; box: Box };
  /** Quads at scale s around the line (0, YC). */
  function piece(qs: readonly Quad[], s = 1): Piece {
    const b = visibleBox(qs);
    return { qs, s, box: [b[0] * s, YC + (b[1] - YC) * s, b[2] * s, YC + (b[3] - YC) * s] };
  }
  function put(p: Piece, dx: number, dy = 0): LogoPart {
    const transform =
      p.s !== 1 ? `translate(${f2(dx)} ${f2(dy + YC)}) scale(${p.s.toFixed(4)}) translate(0 ${f2(-YC)})` : dx || dy ? `translate(${f2(dx)} ${f2(dy)})` : undefined;
    return { d: p.qs.map(quadPath).join(""), ...(transform ? { transform } : {}), box: [p.box[0] + dx, p.box[1] + dy, p.box[2] + dx, p.box[3] + dy] };
  }
  /** Parts left to right, one gap apart, all on the line. */
  function row(pieces: Piece[]) {
    let x = 0;
    return pieces.map((p) => {
      const o = put(p, x - p.box[0]);
      x = o.box[2] + z.gap;
      return o;
    });
  }
  /** Icon on the right; Arabic above English, right-aligned one gap from it, each x-height as high as a visible square, beside it. */
  function stack() {
    const icon = put(piece(ICON_Q), 0);
    const s = z.square / z.english.xh;
    const lines = [(z.icon.tl[1] + z.icon.tl[5]) / 2, (z.icon.br[1] + z.icon.br[5]) / 2];
    return [icon, ...[AR_Q, EN_Q].map((qs, i) => {
      const p = piece(qs, s);
      return put(p, icon.box[0] - z.gap - p.box[2], lines[i]! - YC);
    })];
  }

  function layout(version: LogoVersion): { viewBox: Box; parts: LogoPart[] } {
    const icon = piece(ICON_Q), ar = piece(AR_Q), en = piece(EN_Q);
    const parts =
      version === "icon" ? [put(icon, 0)]
      : version === "en" ? [put(en, 0)]
      : version === "ar" ? [put(ar, 0)]
      : version === "icon-en" ? row([icon, en])
      : version === "icon-ar" ? row([ar, icon])
      : version === "row" ? row([ar, icon, en])
      : stack();
    const b = parts.map((p) => p.box).reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[2]), Math.max(a[3], c[3])]);
    const r = (n: number) => +n.toFixed(3) || 0; // no float noise (or -0) in the SVG markup
    return { viewBox: [r(b[0]), r(b[1]), r(b[2] - b[0]), r(b[3] - b[1])], parts };
  }

  return { sizes: z, icon: z.icon, arabic, english, visibleBox, layout };
}

const LOGO = buildLogo(LOGO_SIZES);

export const LOGO_STROKE = LOGO_SIZES.stroke;
/** The line: the middle of the icon. Every part of a row is centred on it. */
export const LOGO_LINE_Y = LOGO_SIZES.line;
/** One logo square: the unit for gaps and clear space. */
export const LOGO_SQUARE = LOGO_SIZES.gap;
export const LOGO_ICON = LOGO.icon;
export const LOGO_ARABIC = LOGO.arabic;
export const LOGO_ENGLISH = LOGO.english;
/** What you see of some quads: their path bounds plus half the stroke. */
export const visibleBox = LOGO.visibleBox;
export const logoLayout = LOGO.layout;
