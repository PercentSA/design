import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dir, "..");
const PACKAGES = ["tokens", "ui", "motion"] as const;
const run = (cmd: string[], cwd = ROOT) => Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
const distFiles = (pkg: string) => [...new Bun.Glob("**/*.js").scanSync(resolve(ROOT, `packages/${pkg}/dist`))];

describe("published packages", () => {
  beforeAll(() => {
    const r = run(["bun", "run", "build"]);
    if (r.exitCode !== 0) throw new Error(`build failed: ${r.stderr.toString()}`);
  }, 120_000);

  test.each(PACKAGES)("@percentsa/%s: dist has ESM and type declarations", (pkg) => {
    expect(existsSync(resolve(ROOT, `packages/${pkg}/dist/index.js`))).toBe(true);
    expect(existsSync(resolve(ROOT, `packages/${pkg}/dist/index.d.ts`))).toBe(true);
  });

  // One geometry: ui and motion import the logo from @percentsa/tokens, they never bundle a copy of it.
  test.each(["ui", "motion"] as const)("@percentsa/%s imports @percentsa/tokens, no copy of it", (pkg) => {
    const js = distFiles(pkg).map((f) => readFileSync(resolve(ROOT, `packages/${pkg}/dist`, f), "utf8")).join("\n");
    expect([js.includes('from "@percentsa/tokens"'), js.includes("tokens/src")]).toEqual([true, false]);
  });

  // One file per module: each client module keeps its "use client" line; the index has none.
  test.each(["ui", "motion"] as const)("@percentsa/%s: dist keeps \"use client\" per module", (pkg) => {
    const marked = (path: string) => readFileSync(path, "utf8").startsWith('"use client";');
    const wrong = distFiles(pkg).filter((f) => {
      const src = resolve(ROOT, `packages/${pkg}/src`, f.replace(/\.js$/, ""));
      return marked(resolve(ROOT, `packages/${pkg}/dist`, f)) !== marked(existsSync(`${src}.tsx`) ? `${src}.tsx` : `${src}.ts`);
    });
    expect([wrong, marked(resolve(ROOT, `packages/${pkg}/dist/index.js`))]).toEqual([[], false]);
  });

  // Node ESM and TypeScript "nodenext" need the file name in relative imports (scripts/dist-imports.ts).
  test.each(PACKAGES)("@percentsa/%s: relative imports in dist name the file", (pkg) => {
    const dist = resolve(ROOT, `packages/${pkg}/dist`);
    const bare = [...new Bun.Glob("**/*.{js,d.ts}").scanSync(dist)]
      .filter((f) => /(?:from|import)\s*\(?\s*"\.{1,2}\/[^"]*(?<!\.js)"/.test(readFileSync(resolve(dist, f), "utf8")));
    expect(bare).toEqual([]);
  });

  // A server-rendered app imports the package in Node (React Router SSR externalizes node_modules).
  test.each(PACKAGES)("@percentsa/%s loads in Node", (pkg) => {
    const r = run(["node", "--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(resolve(ROOT, `packages/${pkg}/dist/index.js`)).href)})`]);
    expect(r.stderr.toString().split("\n")[0]).toBe("");
    expect(r.exitCode).toBe(0);
  });
});

describe("shadcn registry", () => {
  let registry: { items: { name: string; files: { path: string; target?: string }[]; registryDependencies?: string[]; meta?: { exports?: string[] } }[] };
  beforeAll(() => {
    const r = run(["bun", "scripts/registry.ts", "--check"]);
    if (r.exitCode !== 0) throw new Error(r.stderr.toString() || r.stdout.toString());
    registry = JSON.parse(readFileSync(resolve(ROOT, "registry.json"), "utf8"));
  });

  test("every exported component and function of ui and motion is in an item", async () => {
    const listed = new Set(registry.items.flatMap((i) => i.meta?.exports ?? []));
    for (const pkg of ["ui", "motion"]) {
      const mod = await import(resolve(ROOT, `packages/${pkg}/src/index.ts`));
      const missing = Object.keys(mod).filter((name) => !listed.has(name));
      expect([pkg, missing]).toEqual([pkg, []]);
    }
  });
  test("every file exists, and every dependency is an item", () => {
    const names = new Set(registry.items.map((i) => i.name));
    for (const item of registry.items) {
      for (const f of item.files) expect([item.name, existsSync(resolve(ROOT, f.path))]).toEqual([item.name, true]);
      for (const d of item.registryDependencies ?? []) expect([item.name, names.has(d.replace("@percentsa/", ""))]).toEqual([item.name, true]);
    }
  });
  test("friendly names point to the file that holds the component", () => {
    const button = registry.items.find((i) => i.name === "button")!;
    expect(button.registryDependencies).toEqual(["@percentsa/actions"]);
    expect(registry.items.find((i) => i.name === "date-picker")!.registryDependencies).toEqual(["@percentsa/calendar"]);
  });
});

describe("tokens package", () => {
  // Fonts are a brand setting: a font license may not allow redistribution in a package.
  test("ships no font files", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "packages/tokens/package.json"), "utf8"));
    expect([pkg.files, Object.keys(pkg.exports).filter((k) => k.includes("font")), pkg.dependencies]).toEqual([["dist"], [], undefined]);
  });
});
