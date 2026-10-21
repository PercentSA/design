import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const yml = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

// bun pm pack takes the workspace:^ range of @percentsa/tokens from bun.lock, so the lockfile must
// learn the tag's version before packing (else the peer range stays at the old version).
test("release: the lockfile is updated after the version is set from the tag", () => {
  const version = yml.indexOf("bun pm pkg set version");
  const install = yml.indexOf("run: bun install\n", version);
  const pack = yml.indexOf("&& bun pm pack --destination");
  expect(version).toBeGreaterThan(0);
  expect(install).toBeGreaterThan(version);
  expect(install).toBeLessThan(pack);
});

// A public repo: no self-hosted runner (a fork's code would run on it); trusted publishing needs a GitHub-hosted one.
test("release and CI: GitHub-hosted runners, npm trusted publishing without a token", () => {
  const ci = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  for (const file of [yml, ci]) expect(file).not.toContain("self-hosted");
  expect(yml).toContain("id-token: write");
  expect(yml).toContain('npm publish "./packs/percentsa-$p-$version.tgz" --access public');
  for (const word of ["NODE_AUTH_TOKEN", "NPM_TOKEN", "registry-url", "npm.pkg.github.com"]) expect(yml).not.toContain(word);
});

// A tag for a version that is already on npm (published by hand) still passes.
test("release: a version already on npm is skipped", () => {
  const view = yml.indexOf('npm view "@percentsa/$p@$version" version');
  expect(view).toBeGreaterThan(0);
  expect(view).toBeLessThan(yml.indexOf("npm publish"));
});
