import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");

describe("docs page transitions", () => {
  test("the docs opt in to the slash page transition on <html>", () => {
    expect(read("root.tsx")).toMatch(/<html [^>]*data-page-transition="slash"/);
  });

  test("the provider link plays it for page links, not for links to a place on the same page", () => {
    expect(read("routes/docs-layout.tsx")).toContain('<Link to={href} viewTransition={!href.startsWith("#")} {...p} />');
  });

  test("every React Router <Link> in the docs routes plays it", () => {
    const missing = readdirSync(new URL("../app/routes", import.meta.url))
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => (read(`routes/${f}`).match(/<Link\b[^>]*>/g) ?? []).filter((tag) => !/\bviewTransition\b/.test(tag)).map((tag) => `${f}: ${tag}`));
    expect(missing).toEqual([]);
  });
});
