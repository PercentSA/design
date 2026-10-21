import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  buildLoader,
  buildLogo,
  LOGO_ARABIC,
  LOGO_ENGLISH,
  LOGO_ICON,
  LOGO_SIZES,
  LOGO_SIZES_0_5,
  LOGO_SQUARE,
  LOGO_STROKE,
  LOGO_VERSIONS,
  logoLayout,
  quadPath,
  SLASH_RUN,
  visibleBox,
  type LogoVersion,
  type Quad,
} from "../src";

const close = (a: readonly number[], b: readonly number[], d = 0.01) => {
  expect(a.length).toBe(b.length);
  a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThanOrEqual(d));
};
const near = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 1));
const width = (b: readonly number[]) => b[2]! - b[0]!;
const ICON = [LOGO_ICON.tl, LOGO_ICON.br, LOGO_ICON.slash];
const AR = Object.values(LOGO_ARABIC);
const EN = [LOGO_ENGLISH.stem, LOGO_ENGLISH.armT, LOGO_ENGLISH.armB, ...LOGO_ENGLISH.left, ...LOGO_ENGLISH.right];

describe("logo geometry: the grid (1 square = 100)", () => {
  test("stroke 8: the corners are rounded by 4", () => {
    expect(LOGO_STROKE).toBe(8);
    expect(LOGO_SQUARE).toBe(100);
  });

  test("icon: 3 × 3 squares; the slash joins the top-right and bottom-left cells", () => {
    near(visibleBox(ICON), [-150, 0, 150, 300]);
    near(visibleBox([LOGO_ICON.tl]), [-150, 0, -50, 100]);
    near(visibleBox([LOGO_ICON.br]), [50, 200, 150, 300]);
    close(LOGO_ICON.slash, [52.14, 4, 142.53, 4, -52.14, 296, -142.53, 296]);
    expect((LOGO_ICON.slash[0] - LOGO_ICON.slash[6]) / (LOGO_ICON.slash[7] - LOGO_ICON.slash[1])).toBeCloseTo(2 / 3, 6);
  });

  test("the wipe angle is the slash angle", () => {
    expect(SLASH_RUN).toBeCloseTo(LOGO_SIZES.run, 4);
  });

  test("English: x-height 200, ascender and descender 50, so it is exactly as high as the icon", () => {
    const b = visibleBox(EN);
    near([b[1], b[3]], [0, 300]);
    near(visibleBox([LOGO_ENGLISH.stem]), [-87.23, 50, 87.23, 250]);
    expect([LOGO_ENGLISH.left.length, LOGO_ENGLISH.right.length]).toEqual([11, 11]);
    close(LOGO_ENGLISH.left[0]!, [-490.04, 54, -458.04, 54, -458.04, 296, -490.04, 296]);
    close(LOGO_ENGLISH.right[10]!, [548.04, 214, 629.9, 214, 608.56, 246, 548.04, 246]);
    const sum = (qs: readonly Quad[]) => qs.flat().reduce((a, b) => a + b, 0);
    expect(sum(LOGO_ENGLISH.left)).toBeCloseTo(-6360.86, 1);
    expect(sum(LOGO_ENGLISH.right)).toBeCloseTo(23234.4, 1);
  });

  test("Arabic: as wide as the English; ب bar 320, س 450, ن to the ت dots 150, ت dots to the end 130", () => {
    expect(width(visibleBox(AR))).toBeCloseTo(width(visibleBox(EN)), 6);
    near(visibleBox(AR), [-774.04, 30, 353.9, 250]);
    const cx = (q: Quad) => (visibleBox([q])[0] + visibleBox([q])[2]) / 2;
    const lineEnd = visibleBox([LOGO_ARABIC.lb])[0], lineStart = lineEnd + LOGO_SIZES.arabic.left; // the long line, path length
    expect(lineStart - cx(LOGO_ARABIC.nt)).toBeCloseTo(450, 6);
    expect(cx(LOGO_ARABIC.nt) - (cx(LOGO_ARABIC.td1) + cx(LOGO_ARABIC.td2)) / 2).toBeCloseTo(150, 6);
    expect((cx(LOGO_ARABIC.td1) + cx(LOGO_ARABIC.td2)) / 2 - lineEnd).toBeCloseTo(130, 6);
    expect(LOGO_SIZES.arabic.ba).toBe(320);
  });

  test("ر = the c stem; the ب dot bottom = the ر bottom = 250", () => {
    close(LOGO_ARABIC.slash, LOGO_ENGLISH.stem);
    expect(visibleBox([LOGO_ARABIC.bd])[3]).toBeCloseTo(250, 6);
    expect(visibleBox([LOGO_ARABIC.slash])[3]).toBeCloseTo(250, 6);
  });

  test("quadPath: corners with 2 decimals", () => {
    expect(quadPath(LOGO_ICON.tl)).toBe("M-146.00 4.00L-54.00 4.00L-54.00 96.00L-146.00 96.00Z");
  });
});

describe("the 7 versions", () => {
  const SIZE: Record<LogoVersion, [number, number]> = {
    icon: [300, 300],
    en: [1127.93, 300],
    ar: [1127.93, 220],
    "icon-en": [1527.93, 300],
    "icon-ar": [1527.93, 300],
    row: [2755.87, 300],
    stack: [963.97, 335],
  };
  const byX = (v: LogoVersion) => [...logoLayout(v).parts].sort((a, b) => a.box[0] - b.box[0]);
  const iconBox = visibleBox(ICON);
  const isIcon = (box: readonly number[]) => Math.abs(box[2]! - box[0]! - (iconBox[2] - iconBox[0])) < 0.01 && Math.abs(box[3]! - box[1]! - (iconBox[3] - iconBox[1])) < 0.01;

  test("the list of versions", () => {
    expect([...LOGO_VERSIONS]).toEqual(["icon", "en", "ar", "icon-en", "icon-ar", "row", "stack"]);
  });

  test.each(LOGO_VERSIONS)("%s: viewBox with at most 3 decimals", (v) => {
    for (const n of logoLayout(v).viewBox) expect(n).toBe(+n.toFixed(3));
  });

  test.each(LOGO_VERSIONS)("%s: viewBox size", (v) => {
    const [, , w, h] = logoLayout(v).viewBox;
    near([w, h], SIZE[v]);
  });

  test.each(["icon-en", "icon-ar", "row"] as const)("%s: 1 square between the parts", (v) => {
    const parts = byX(v);
    for (let i = 1; i < parts.length; i++) expect(parts[i]!.box[0] - parts[i - 1]!.box[2]).toBeCloseTo(LOGO_SQUARE, 2);
  });

  test("the icon is at the reading start", () => {
    expect(isIcon(byX("icon-en")[0]!.box)).toBe(true); // English: icon on the left
    expect(isIcon(byX("icon-ar")[1]!.box)).toBe(true); // Arabic: icon on the right
    const row = byX("row"); // Arabic | icon | English
    expect(row.map((p) => isIcon(p.box))).toEqual([false, true, false]);
    expect(row[0]!.box[3] - row[0]!.box[1]).toBeCloseTo(220, 1);
  });

  test("row: the icon is exactly in the middle", () => {
    const { viewBox } = logoLayout("row"), icon = byX("row")[1]!.box;
    expect((icon[0] + icon[2]) / 2).toBeCloseTo(viewBox[0] + viewBox[2] / 2, 2);
  });

  test("stack: icon on the right, Arabic above English, each x-height = one square (scale 0.5)", () => {
    const parts = logoLayout("stack").parts;
    const icon = parts.find((p) => isIcon(p.box))!;
    const words = parts.filter((p) => p !== icon).sort((a, b) => a.box[1] - b.box[1]);
    near(words[0]!.box, [-813.97, -10, -250, 100]); // Arabic
    near(words[1]!.box, [-813.97, 175, -250, 325]); // English
    for (const w of words) {
      expect(w.box[2]).toBeCloseTo(icon.box[0] - LOGO_SQUARE, 2);
      expect(w.transform).toContain("scale(0.5000)");
    }
  });
});

describe("the sizes of 0.5 (kept for a rollback)", () => {
  const L = buildLogo(LOGO_SIZES_0_5);

  test("the icon, the words and the visible boxes of 0.5", () => {
    close(L.icon.tl, [-115.15, 0, -44.35, 0, -44.35, 70.8, -115.15, 70.8]);
    close(L.icon.slash, [45.15, 0, 112.85, 0, -44.85, 221.2, -113.15, 221.2]);
    close(L.arabic.bb, [3.31, 99.66, 201.25, 99.66, 185.63, 121.53, 3.31, 121.53]);
    close(L.english.right[10]!, [372.76, 155.41, 425.59, 155.41, 409.97, 177.28, 372.76, 177.28]);
    near(L.visibleBox(Object.values(L.arabic)), [-361.01, 20.82, 204.56, 180.6]);
    near(L.layout("row").viewBox.slice(2), [1702.94, 238]);
    near(L.layout("stack").viewBox.slice(2), [727.28, 265.87]);
  });

  // Every layout and loader frame (every 50 ms) of 0.5.1, camera with 4 decimals.
  test("the same output as 0.5.1", () => {
    const P = buildLoader(LOGO_SIZES_0_5);
    const json = JSON.stringify({
      layouts: LOGO_VERSIONS.map((v) => L.layout(v)),
      frames: Array.from({ length: 144 }, (_, i) => {
        const f = P.frame(i * 50);
        return { ...f, camera: f.camera.toFixed(4) };
      }),
      viewBox: P.viewBox,
    });
    expect(createHash("sha256").update(json).digest("hex")).toBe("1dd9b22b955fcb28d6bf0362c83904b920166e8263a5b1695774ea17559069d1");
  });
});
