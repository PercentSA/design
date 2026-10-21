import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const DIR = resolve(ROOT, "apps/docs/public/brand");
const VERSIONS = ["icon", "en", "ar", "icon-en", "icon-ar", "row", "stack"];

describe("logo downloads", () => {
  test("the files are up to date with the geometry", () => {
    const r = Bun.spawnSync(["bun", "scripts/logo-files.ts", "--check"], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
    expect(r.stderr.toString()).toBe("");
    expect(r.exitCode).toBe(0);
  });

  test("one white and one black file per version, nothing else", () => {
    const names = VERSIONS.flatMap((v) => [`percent-${v}-white.svg`, `percent-${v}-black.svg`]).sort();
    expect(readdirSync(DIR).sort()).toEqual(names);
  });

  test("white files are white only, black files are black only", () => {
    for (const v of VERSIONS) {
      const white = readFileSync(resolve(DIR, `percent-${v}-white.svg`), "utf8");
      const black = readFileSync(resolve(DIR, `percent-${v}-black.svg`), "utf8");
      expect([v, white.includes("#fff"), white.includes("#000")]).toEqual([v, true, false]);
      expect([v, black.includes("#000"), black.includes("#fff")]).toEqual([v, true, false]);
    }
  });
});
