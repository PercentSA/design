// tsc keeps the extensionless relative imports of the source ("./inputs"); Node ESM and nodenext types need
// the file name. Adds ".js" or "/index.js" to each relative import in dist (.js and .d.ts files).
// Usage (in a package): bun ../../scripts/dist-imports.ts dist
import { Glob } from "bun";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dist = resolve(process.argv[2] ?? "dist");
const SPEC = /(\bfrom\s*|\bimport\s*\(?\s*)"(\.{1,2}\/[^"]*)"/g;

for (const file of new Glob("**/*.{js,d.ts}").scanSync(dist)) {
  const path = resolve(dist, file);
  const ext = file.endsWith(".d.ts") ? ".d.ts" : ".js";
  const out = readFileSync(path, "utf8").replace(SPEC, (match, head: string, spec: string) => {
    if (/\.(?:[cm]?js|json|css)$/.test(spec)) return match;
    const base = resolve(dirname(path), spec);
    if (existsSync(base + ext)) return `${head}"${spec}.js"`;
    if (existsSync(resolve(base, `index${ext}`))) return `${head}"${spec}/index.js"`;
    throw new Error(`${file}: cannot resolve ${spec}`);
  });
  writeFileSync(path, out);
}
