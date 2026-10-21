// Builds the shadcn-style registry for copy-in components.
//   registry.json                         index (committed): items, files, dependencies
//   apps/docs/app/registry.generated.json  items with file contents, served by the docs at /r/<name>.json
// One item per source file; its relative imports become registry dependencies, so `shadcn add`
// copies the files it needs into components/percent/<pkg>/ with the same folder layout.
// `--check`: fail when registry.json is not up to date.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative as osRelative, resolve, sep } from "node:path";

// Registry paths and names use "/" on every OS (Windows paths use "\\").
const relative = (from: string, to: string) => osRelative(from, to).split(sep).join("/");

const ROOT = resolve(import.meta.dir, "..");
const PKGS = ["ui", "motion"] as const;
type Pkg = (typeof PKGS)[number];

type FileInfo = { pkg: Pkg; rel: string; path: string; content: string };
type Item = {
  name: string;
  type: "registry:ui" | "registry:lib" | "registry:file";
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; type: string; target: string; content?: string }[];
  meta?: { exports?: string[] };
};

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

const files: FileInfo[] = PKGS.flatMap((pkg) => {
  const src = join(ROOT, "packages", pkg, "src");
  return walk(src)
    .filter((f) => /\.tsx?$/.test(f) && relative(src, f) !== "index.ts")
    .sort()
    .map((f) => ({ pkg, rel: relative(src, f), path: relative(ROOT, f), content: readFileSync(f, "utf8") }));
});

const base = (rel: string) => rel.replace(/\.tsx?$/, "").split("/");
function itemName(f: FileInfo) {
  const parts = base(f.rel);
  const last = parts.at(-1)!;
  if (f.pkg === "motion") return `motion-${last}`;
  if (parts[0] === "components" || parts.length === 1) return last;
  if (parts[0] === "saudi") return `saudi-${last}`;
  return last; // lib/cn, i18n/strings, i18n/localized
}

const nameOf = new Map(files.map((f) => [f.path, itemName(f)]));
if (new Set(nameOf.values()).size !== files.length) throw new Error("two source files map to the same registry name");

function resolveImport(from: FileInfo, spec: string) {
  const target = join(dirname(join(ROOT, from.path)), spec);
  for (const c of [`${target}.ts`, `${target}.tsx`, join(target, "index.ts")]) if (existsSync(c)) return relative(ROOT, c);
  throw new Error(`${from.path}: cannot resolve ${spec}`);
}

const exportsOf = (src: string) => {
  const names = [...src.matchAll(/^export (?:async )?(?:function|const|class) (\w+)/gm)].map((m) => m[1]!);
  for (const m of src.matchAll(/^export \{([^}]+)\};?$/gm)) names.push(...m[1]!.split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("type ")));
  return [...new Set(names)];
};

const target = (pkg: Pkg, rel: string) => `components/percent/${pkg}/${rel}`;

const items: Item[] = files.map((f) => {
  const imports = [...f.content.matchAll(/(?:from|import) "([^"]+)"/g)].map((m) => m[1]!);
  const local = [...new Set(imports.filter((s) => s.startsWith(".")).map((s) => nameOf.get(resolveImport(f, s))!))].sort();
  const npm = [...new Set(imports.filter((s) => !s.startsWith(".") && !/^react(-dom)?(\/|$)/.test(s)))].sort();
  const exports = exportsOf(f.content);
  const isUi = f.rel.endsWith(".tsx");
  const type = isUi ? "registry:ui" : "registry:lib";
  return {
    name: nameOf.get(f.path)!,
    type,
    title: exports.filter((e) => /^[A-Z]/.test(e)).slice(0, 4).join(", ") || exports.slice(0, 4).join(", "),
    description: `@percentsa/${f.pkg}: ${exports.join(", ")}`,
    ...(npm.length ? { dependencies: npm } : {}),
    ...(local.length ? { registryDependencies: local.map((n) => `@percentsa/${n}`) } : {}),
    files: [{ path: f.path, type, target: target(f.pkg, f.rel) }],
    meta: { exports },
  };
});

for (const pkg of PKGS)
  items.push({
    name: pkg === "ui" ? "styles" : "motion-styles",
    type: "registry:file",
    title: `@percentsa/${pkg} styles`,
    description: `Component CSS of @percentsa/${pkg}. Import it after @percentsa/tokens/theme.css.`,
    files: [{ path: `packages/${pkg}/styles.css`, type: "registry:file", target: target(pkg, "styles.css") }],
  });

// Friendly names: `shadcn add @percentsa/button` adds the file that holds Button.
const taken = new Set(items.map((i) => i.name));
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
for (const item of [...items])
  for (const e of item.meta?.exports ?? []) {
    const alias = kebab(e);
    if (!/^[A-Z]/.test(e) || taken.has(alias)) continue;
    taken.add(alias);
    items.push({ name: alias, type: "registry:ui", title: e, description: `${e}: adds @percentsa/${item.name}.`, registryDependencies: [`@percentsa/${item.name}`], files: [] });
  }

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "percentsa",
  homepage: "https://github.com/PercentSA/design",
  items,
};
const json = JSON.stringify(registry, null, 2) + "\n";
const indexPath = join(ROOT, "registry.json");

if (process.argv.includes("--check")) {
  if (!existsSync(indexPath) || readFileSync(indexPath, "utf8") !== json) {
    console.error("registry.json is out of date: run `bun run registry`.");
    process.exit(1);
  }
} else writeFileSync(indexPath, json);

// The served items carry the file contents. Copy-in styles have no @source: the app scans its own files.
const content = (path: string) => readFileSync(join(ROOT, path), "utf8").replace(/^@source .*\n/m, "");
const served = Object.fromEntries(
  items.map((i) => [
    i.name,
    { $schema: "https://ui.shadcn.com/schema/registry-item.json", ...i, files: i.files.map((f) => ({ ...f, content: content(f.path) })) },
  ]),
);
writeFileSync(join(ROOT, "apps/docs/app/registry.generated.json"), JSON.stringify(served));
console.log(`registry: ${items.length} items`);
