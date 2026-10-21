// Writes the logo downloads (every version in white and black) to apps/docs/public/brand from the geometry in
// packages/tokens/src/logo.ts. `--check`: fail when a file is missing, extra or not up to date.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LOGO_STROKE, LOGO_VERSIONS, logoLayout } from "../packages/tokens/src/index.ts";

const DIR = resolve(import.meta.dir, "../apps/docs/public/brand");

const files = new Map<string, string>();
for (const v of LOGO_VERSIONS) {
  const { viewBox, parts } = logoLayout(v);
  const paths = parts.map((p) => `<path d="${p.d}"${p.transform ? ` transform="${p.transform}"` : ""}/>`).join("");
  for (const [name, colour] of [["white", "#fff"], ["black", "#000"]] as const)
    files.set(
      `percent-${v}-${name}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(" ")}" width="${viewBox[2].toFixed(2)}" height="${viewBox[3].toFixed(2)}">` +
        `<g fill="${colour}" stroke="${colour}" stroke-width="${LOGO_STROKE}" stroke-linejoin="round">${paths}</g></svg>\n`,
    );
}

if (process.argv.includes("--check")) {
  const have = existsSync(DIR) ? readdirSync(DIR) : [];
  const wrong = [
    ...[...files.keys()].filter((f) => !have.includes(f)).map((f) => `missing: ${f}`),
    ...have.filter((f) => !files.has(f)).map((f) => `extra: ${f}`),
    ...have.filter((f) => files.has(f) && readFileSync(join(DIR, f), "utf8") !== files.get(f)).map((f) => `changed: ${f}`),
  ];
  if (wrong.length) {
    console.log(`Logo files are not up to date (run bun run logo-files):\n${wrong.join("\n")}`);
    process.exit(1);
  }
} else {
  mkdirSync(DIR, { recursive: true });
  for (const [f, svg] of files) writeFileSync(join(DIR, f), svg);
  console.log(`logo files: ${files.size}`);
}
