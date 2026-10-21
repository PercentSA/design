import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { PAGES } from "../app/docs/catalogue";
import { FOUNDATIONS } from "../app/docs/foundations";

// Builds the docs and runs the production server (server.ts), as in the Docker image.
const ROOT = resolve(import.meta.dir, "..");
const PORT = 5191;
const BASE = `http://localhost:${PORT}`;
let server: ReturnType<typeof Bun.spawn> | undefined;

beforeAll(async () => {
  const build = Bun.spawnSync(["bun", "run", "build"], { cwd: ROOT, stdout: "ignore", stderr: "pipe" });
  if (build.exitCode !== 0) throw new Error(`build failed: ${build.stderr.toString()}`);
  server = Bun.spawn(["bun", "--bun", "run", "start"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
    stdout: "ignore",
    stderr: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    if (await fetch(`${BASE}/healthz`).then((r) => r.ok, () => false)) return;
    await Bun.sleep(100);
  }
  throw new Error("docs server did not start");
}, 120_000);

afterAll(() => server?.kill());

describe("docs server", () => {
  test("every page renders on the server, in English and Arabic", async () => {
    const paths = ["", "/all", "/changelog", ...FOUNDATIONS.map((f) => `/foundations/${f.slug}`), ...PAGES.map((p) => `/components/${p.slug}`)];
    const failures: string[] = [];
    for (const lang of ["en", "ar"])
      for (const path of paths) {
        const res = await fetch(`${BASE}/${lang}${path}`);
        const html = await res.text();
        if (res.status !== 200 || !html.includes(`<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"`)) failures.push(`${res.status} /${lang}${path}`);
      }
    expect(failures).toEqual([]);
  }, 60_000);
  test("the Brand page links the logo downloads, and the server sends them as SVG", async () => {
    const html = await (await fetch(`${BASE}/en/foundations/brand`)).text();
    const links = [...html.matchAll(/href="(\/brand\/percent-[\w-]+\.svg)" download/g)].map((m) => m[1]);
    expect(links.length).toBe(14);
    const res = await fetch(`${BASE}${links[0]}`);
    expect([res.status, res.headers.get("content-type")?.startsWith("image/svg+xml")]).toEqual([200, true]);
  });
  test("the overview page shows every component and links to its page, in both languages", async () => {
    for (const lang of ["en", "ar"]) {
      const html = await (await fetch(`${BASE}/${lang}/all`)).text();
      // Examples can hold <article>s of their own; split at the cards.
      const cards = html.split("<article data-card").slice(1);
      const missing = PAGES.filter((p) => !cards.some((c) => c.includes(`href="/${lang}/components/${p.slug}"`)));
      expect([lang, cards.length, missing.map((p) => p.slug)]).toEqual([lang, PAGES.length, []]);
    }
  });
  test("public: pages, data, built files and the health check need no password", async () => {
    const page = await fetch(`${BASE}/en`);
    expect([page.status, page.headers.get("www-authenticate")]).toEqual([200, null]);
    expect((await fetch(`${BASE}/en/components/button.data`)).status).toBe(200);
    expect((await fetch(`${BASE}/healthz`)).status).toBe(200);
    const asset = (await page.text()).match(/\/assets\/[\w.-]+\.js/)?.[0];
    expect(asset).toBeDefined();
    const file = await fetch(`${BASE}${asset}`);
    expect([file.status, file.headers.get("cache-control")]).toEqual([200, "public, max-age=31536000, immutable"]);
    // An encoded "../" must not reach files outside build/client.
    const outside = await fetch(`${BASE}/assets/..%2f..%2f..%2fpackage.json`, { redirect: "manual" });
    expect(await outside.text()).not.toContain('"name": "docs"');
  });
  test("search engines may index the docs; pages have a description", async () => {
    const button = await (await fetch(`${BASE}/ar/components/button`)).text();
    expect(button).not.toContain("noindex");
    expect(button).toMatch(/<meta name="description" content="[^"]+"/);
    expect(await (await fetch(`${BASE}/en`)).text()).toMatch(/<meta name="description" content="[^"]+"/);
  });
  test("public pages: no password instructions; safe headers; one theme per cookie in caches", async () => {
    const home = await fetch(`${BASE}/en`);
    const html = await home.text();
    expect(html).not.toContain("DOCS_AUTH");
    // Public packages on npm: no registry token, no font import.
    expect(html).not.toContain("npm.pkg.github.com");
    expect(html).not.toContain("fonts.css");
    expect(home.headers.get("x-content-type-options")).toBe("nosniff");
    expect(home.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(home.headers.get("vary")).toContain("Cookie");
    expect((await fetch(`${BASE}/ar`)).headers.get("x-content-type-options")).toBe("nosniff");
  });
  test("code names in descriptions: <code> on the page, plain in the meta description", async () => {
    const html = await (await fetch(`${BASE}/en/components/heading`)).text();
    expect(html).toMatch(/<code[^>]*>level<\/code>/);
    expect(html).not.toMatch(/`level`/);
    expect(/<meta name="description" content="([^"]+)"/.exec(html)![1]).not.toContain("`");
  });
  test("caches ask the server again for pages", async () => {
    expect((await fetch(`${BASE}/en`)).headers.get("cache-control")).toBe("no-cache");
  });
  test("unknown pages: 404; unknown language: to English", async () => {
    expect((await fetch(`${BASE}/en/components/nope`)).status).toBe(404);
    expect((await fetch(`${BASE}/en/whatever`)).status).toBe(404);
    const r = await fetch(`${BASE}/xx`, { redirect: "manual" });
    expect([r.status, r.headers.get("location")]).toEqual([302, "/en"]);
  });
});

describe("registry", () => {
  test("items are served with their source", async () => {
    const button = await (await fetch(`${BASE}/r/button.json`)).json();
    expect(button.registryDependencies).toEqual(["@percentsa/actions"]);
    const actions = await (await fetch(`${BASE}/r/actions.json`)).json();
    expect(actions.files[0].content).toContain("export function Button(");
    expect(actions.files[0].target).toBe("components/percent/ui/components/actions.tsx");
    expect((await fetch(`${BASE}/r/nope.json`)).status).toBe(404);
    for (const key of ["toString", "constructor", "__proto__"]) expect((await fetch(`${BASE}/r/${key}.json`)).status).toBe(404);
  });
});
