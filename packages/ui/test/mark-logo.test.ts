import { expect, test } from "bun:test";
import { LOGO_ICON } from "@percentsa/tokens";
import { MARK_PATH } from "../src";

// <Mark> (MARK_PATH, 0..230) and the logo icon (LOGO_ICON, centred on its slash) are the same shape.
test("MARK_PATH, moved by -115.15, is LOGO_ICON", () => {
  // M x y H x V y H x Z, twice; then M x y H x L x y H x Z.
  const [a, b, c] = MARK_PATH.split("Z").filter((p) => p.trim()).map((p) => p.match(/-?\d+(\.\d+)?/g)!.map(Number));
  const rect = ([x0, y0, x1, y1]: number[]) => [x0!, y0!, x1!, y0!, x1!, y1!, x0!, y1!];
  const [sx, sy, sx1, lx, ly, lx1] = c!;
  const quads = [rect(a!), rect(b!), [sx!, sy!, sx1!, sy!, lx!, ly!, lx1!, ly!]].map((q) => q.map((v, i) => (i % 2 ? v : v - 115.15)));
  [LOGO_ICON.tl, LOGO_ICON.br, LOGO_ICON.slash].forEach((q, k) => q.forEach((v, i) => expect(Math.abs(v - quads[k]![i]!)).toBeLessThan(0.001)));
});
