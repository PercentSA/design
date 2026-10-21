import { expect, test } from "bun:test";
import { resolve } from "node:path";

// The Arabic name is برسنت (as in the Arabic logo). Built from code points so this file does not hold the misspelling.
const MISSPELLED = String.fromCharCode(0x628, 0x64a, 0x631, 0x633, 0x646, 0x62a);

test("the Arabic name is spelled برسنت in every tracked file", () => {
  const r = Bun.spawnSync(["git", "grep", "-l", "-I", "-F", MISSPELLED], { cwd: resolve(import.meta.dir, ".."), stdout: "pipe" });
  expect(r.stdout.toString()).toBe("");
});
