import { expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// React Server Components: a module with hooks, context, event handlers or browser globals starts with
// "use client"; a module without them does not, so server code can import and call its functions.
const ROOT = resolve(import.meta.dir, "..");
const CLIENT = /\buse[A-Z]\w*\(|\bcreateContext\(|\bon[A-Z]\w*=\{|\b(?:document|window|localStorage|navigator)\.|\brequestAnimationFrame\(/;
// Comments and string literals: a word in a comment or in a script string is not a client feature.
const NOISE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g;
const DIRECTIVE = /^"use client";\n/;
// Client-only by nature: the toast store and the form-field context.
const CLIENT_VALUES = new Set(["toast", "dismissToast", "fieldContext"]);

const read = (path: string) => readFileSync(path, "utf8");
const sources = (pkg: string) => [...new Glob("**/*.{ts,tsx}").scanSync(resolve(ROOT, `packages/${pkg}/src`))].sort();

test.each(["ui", "motion"])("@percentsa/%s: \"use client\" exactly in modules with client features", (pkg) => {
  const wrong = sources(pkg)
    .filter((file) => file !== "index.ts")
    .filter((file) => {
      const src = read(resolve(ROOT, `packages/${pkg}/src`, file));
      return DIRECTIVE.test(src) !== CLIENT.test(src.replace(NOISE, ""));
    });
  expect(wrong).toEqual([]);
});

test.each(["ui", "motion"])("@percentsa/%s: the index has no directive", (pkg) => {
  expect(read(resolve(ROOT, `packages/${pkg}/src/index.ts`))).not.toMatch(/^"use client"/);
});

// A server component can call a function or read a constant only from a module without "use client".
test.each(["ui", "motion"])("@percentsa/%s: functions and constants come from server-safe modules", (pkg) => {
  const index = resolve(ROOT, `packages/${pkg}/src/index.ts`);
  const wrong: string[] = [];
  for (const m of read(index).matchAll(/^export \{([^}]+)\} from "(\.[^"]+)";$/gm)) {
    const names = m[1]!.split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("type "));
    const base = resolve(dirname(index), m[2]!);
    const file = [`${base}.ts`, `${base}.tsx`].find((f) => Bun.file(f).size > 0)!;
    if (!DIRECTIVE.test(read(file))) continue;
    // Components (PascalCase) and hooks may come from a client module; nothing else may.
    wrong.push(...names.filter((n) => !/^[A-Z][a-z]/.test(n) && !/^use[A-Z]/.test(n) && !CLIENT_VALUES.has(n)));
  }
  expect(wrong).toEqual([]);
});
