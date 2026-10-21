import { describe, expect, test } from "bun:test";
import { LOADER_LOOP_MS, LOADER_STAGES, LOADER_VIEWBOX, LOGO_ARABIC, LOGO_ENGLISH, LOGO_ICON, logoLoaderFrame, quadPath, visibleBox, type LoaderFrame, type Quad } from "../src";

const paths = (f: LoaderFrame) => [...f.main, ...f.left, ...f.right].sort();
const still = (qs: readonly Quad[]) => qs.map(quadPath).sort();
const ICON = still([LOGO_ICON.tl, LOGO_ICON.br, LOGO_ICON.slash]);
const ARABIC = still(Object.values(LOGO_ARABIC));
const ENGLISH = still([LOGO_ENGLISH.stem, LOGO_ENGLISH.armT, LOGO_ENGLISH.armB, ...LOGO_ENGLISH.left, ...LOGO_ENGLISH.right]);

describe("logo loader frames", () => {
  test("the loop: logo → Arabic → logo → English → logo, 7.2 s", () => {
    expect(LOADER_STAGES.map((s) => [s.word, s.from, s.to, s.ms])).toEqual([
      ["ar", 1, 1, 400], ["ar", 1, 0, 1200], ["ar", 0, 0, 800], ["ar", 0, 1, 1200],
      ["en", 1, 1, 400], ["en", 1, 0, 1200], ["en", 0, 0, 800], ["en", 0, 1, 1200],
    ]);
    expect(LOADER_LOOP_MS).toBe(7200);
    expect([...LOADER_VIEWBOX]).toEqual([-620, -50, 1240, 400]);
  });

  test("it starts on the still icon, centred", () => {
    expect(paths(logoLoaderFrame(0))).toEqual(ICON);
    expect(logoLoaderFrame(0).camera).toBeCloseTo(0, 5);
  });

  test("the still words fit in the view box", () => {
    const [x, y, w, h] = LOADER_VIEWBOX;
    for (const [ms, qs] of [[2000, Object.values(LOGO_ARABIC)], [5600, [LOGO_ENGLISH.stem, LOGO_ENGLISH.armT, LOGO_ENGLISH.armB, ...LOGO_ENGLISH.left, ...LOGO_ENGLISH.right]]] as const) {
      const b = visibleBox(qs), cam = logoLoaderFrame(ms).camera;
      expect([b[0] + cam >= x, b[2] + cam <= x + w, b[1] >= y, b[3] <= y + h]).toEqual([true, true, true, true]);
    }
  });

  test("the word holds are exactly the still wordmarks", () => {
    expect(paths(logoLoaderFrame(2000))).toEqual(ARABIC);
    expect(paths(logoLoaderFrame(5600))).toEqual(ENGLISH);
  });

  test("it loops", () => {
    expect(logoLoaderFrame(LOADER_LOOP_MS)).toEqual(logoLoaderFrame(0));
    expect(logoLoaderFrame(-LOADER_LOOP_MS)).toEqual(logoLoaderFrame(0));
  });

  test("mid-change: the word slides out of the slash", () => {
    expect(logoLoaderFrame(1100).left.length).toBeGreaterThan(0);
    expect(logoLoaderFrame(4700 + 400).left.length).toBeGreaterThan(0);
  });

  test("no jump at any stage edge", () => {
    const nums = (f: LoaderFrame) => paths(f).join(" ").match(/-?\d+\.\d+/g)!.map(Number);
    for (const edge of [400, 1600, 2400, 3600, 4000, 5200, 6000, 7200]) {
      const a = nums(logoLoaderFrame(edge - 0.01)), b = nums(logoLoaderFrame(edge));
      expect([edge, a.length]).toEqual([edge, b.length]);
      expect([edge, Math.max(...a.map((v, i) => Math.abs(v - b[i]!))) < 0.05]).toEqual([edge, true]);
    }
  });
});
