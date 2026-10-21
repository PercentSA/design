import { describe, expect, test } from "bun:test";
import { LOGO_ARABIC, LOGO_ENGLISH, LOGO_ICON, LOGO_SQUARE, LOGO_VERSIONS, logoLayout, quadPath, visibleBox, type LogoVersion, type Quad } from "../src";

// Values from docs/brand/portal-loader.html (the approved geometry), computed on 2026-10-21.
const close = (a: readonly number[], b: readonly number[], d = 0.01) => {
  expect(a.length).toBe(b.length);
  a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThanOrEqual(d));
};
const near = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 1));

describe("logo geometry", () => {
  test("icon: the Mark path, centred on its slash", () => {
    close(LOGO_ICON.tl, [-115.15, 0, -44.35, 0, -44.35, 70.8, -115.15, 70.8]);
    close(LOGO_ICON.br, [44.05, 150.4, 114.85, 150.4, 114.85, 221.2, 44.05, 221.2]);
    close(LOGO_ICON.slash, [45.15, 0, 112.85, 0, -44.85, 221.2, -113.15, 221.2]); // MARK_PATH, not slashQ(67.7)
  });

  test("Arabic word = reference W", () => {
    close(LOGO_ARABIC.slash, [34.19, 43.91, 61.07, 43.91, -34.19, 177.28, -61.07, 177.28]);
    close(LOGO_ARABIC.bb, [3.31, 99.66, 201.25, 99.66, 185.63, 121.53, 3.31, 121.53]);
    close(LOGO_ARABIC.bd, [157.87, 151.14, 184.02, 151.14, 184.02, 177.28, 157.87, 177.28]);
    close(LOGO_ARABIC.lb, [-357.7, 99.66, -25.27, 99.66, -40.9, 121.53, -357.7, 121.53]);
    close(LOGO_ARABIC.tu, [-357.7, 83.99, -335.83, 83.99, -335.83, 121.53, -357.7, 121.53]);
    close(LOGO_ARABIC.nt, [-176.07, 83.99, -154.2, 83.99, -154.2, 121.53, -176.07, 121.53]);
    close(LOGO_ARABIC.nd, [-178.2, 24.14, -152.06, 24.14, -152.06, 50.28, -178.2, 50.28]);
    close(LOGO_ARABIC.td1, [-302.43, 39.81, -276.28, 39.81, -276.28, 65.96, -302.43, 65.96]);
    close(LOGO_ARABIC.td2, [-259.82, 39.81, -233.68, 39.81, -233.68, 65.96, -259.82, 65.96]);
  });

  test("English word = reference enWord(EN)", () => {
    close(LOGO_ENGLISH.stem, [34.19, 43.91, 61.07, 43.91, -34.19, 177.28, -61.07, 177.28]);
    close(LOGO_ENGLISH.armT, [34.19, 43.91, 112.07, 43.91, 96.45, 65.78, 18.57, 65.78]);
    close(LOGO_ENGLISH.armB, [-45.45, 155.41, 32.43, 155.41, 16.81, 177.28, -61.07, 177.28]);
    expect([LOGO_ENGLISH.left.length, LOGO_ENGLISH.right.length]).toEqual([11, 11]);
    close(LOGO_ENGLISH.left[0]!, [-326.92, 43.91, -305.05, 43.91, -305.05, 226.28, -326.92, 226.28]);
    close(LOGO_ENGLISH.right[10]!, [372.76, 155.41, 425.59, 155.41, 409.97, 177.28, 372.76, 177.28]);
    const sum = (qs: readonly Quad[]) => qs.flat().reduce((a, b) => a + b, 0);
    expect(sum(LOGO_ENGLISH.left)).toBeCloseTo(-3717.52, 1);
    expect(sum(LOGO_ENGLISH.right)).toBeCloseTo(16128.74, 1);
  });

  test("ر = the c stem; the ب dot bottom = the ر bottom = 180.6", () => {
    close(LOGO_ARABIC.slash, LOGO_ENGLISH.stem);
    expect(visibleBox([LOGO_ARABIC.bd])[3]).toBeCloseTo(180.6, 2);
    expect(visibleBox([LOGO_ARABIC.slash])[3]).toBeCloseTo(180.6, 2);
  });

  test("visible boxes (path + half the 6.63 stroke)", () => {
    near(visibleBox([LOGO_ICON.tl, LOGO_ICON.br, LOGO_ICON.slash]), [-118.47, -3.32, 118.17, 224.52]);
    near(visibleBox(Object.values(LOGO_ARABIC)), [-361.01, 20.82, 204.56, 180.6]);
    near(visibleBox([LOGO_ENGLISH.stem, LOGO_ENGLISH.armT, LOGO_ENGLISH.armB, ...LOGO_ENGLISH.left, ...LOGO_ENGLISH.right]), [-330.23, -8.4, 428.9, 229.6]);
  });

  test("quadPath: corners with 2 decimals", () => {
    expect(quadPath(LOGO_ICON.tl)).toBe("M-115.15 0.00L-44.35 0.00L-44.35 70.80L-115.15 70.80Z");
  });
});

describe("the 7 versions", () => {
  const SIZE: Record<LogoVersion, [number, number]> = {
    icon: [236.63, 227.83],
    en: [759.13, 238],
    ar: [565.57, 159.78],
    "icon-en": [1066.57, 238],
    "icon-ar": [873.01, 227.83],
    row: [1702.94, 238],
    stack: [727.28, 265.87],
  };
  const byX = (v: LogoVersion) => [...logoLayout(v).parts].sort((a, b) => a.box[0] - b.box[0]);
  const iconBox = visibleBox([LOGO_ICON.tl, LOGO_ICON.br, LOGO_ICON.slash]);
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
    expect(row[0]!.box[3] - row[0]!.box[1]).toBeCloseTo(159.78, 1);
  });

  test("stack: icon on the right, Arabic above English, each x-height = one visible square", () => {
    const parts = logoLayout("stack").parts;
    const icon = parts.find((p) => isIcon(p.box))!;
    const words = parts.filter((p) => p !== icon).sort((a, b) => a.box[1] - b.box[1]);
    near(words[0]!.box, [-502.07, -14.25, -189.26, 74.12]); // Arabic
    near(words[1]!.box, [-609.12, 119.98, -189.26, 251.62]); // English
    for (const w of words) {
      expect(w.box[2]).toBeCloseTo(icon.box[0] - LOGO_SQUARE, 2);
      expect(w.transform).toContain("scale(0.5531)");
    }
  });
});
