import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of the first rule (from index `from`) whose selector list contains `selector`. */
const rule = (selector: string, from = 0) => {
  const at = css.indexOf(selector, from);
  if (at < 0) return "";
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
};
/** The text of the block that starts at the first `head` (an at-rule), with nested blocks. */
const block = (head: string, from = 0) => {
  const at = css.indexOf(head, from);
  if (at < 0) return "";
  let depth = 0;
  for (let i = css.indexOf("{", at); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(at, i + 1);
  }
  return "";
};
const keyframes = (name: string) => block(`@keyframes ${name} `);
/** Brace depth at an index: 0 = not inside any at-rule or rule. */
const depthAt = (i: number) => [...css.slice(0, i)].reduce((d, c) => d + (c === "{" ? 1 : c === "}" ? -1 : 0), 0);

describe("page transitions", () => {
  test("every view-transition rule is opted in by data-page-transition on <html>", () => {
    const selectors = css.match(/[^{};]*::view-transition[^{]*/g) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors.flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean)) expect(s).toMatch(/^html\[data-page-transition/);
  });

  test("fade: a cross-fade with the fast duration and the token easing", () => {
    const r = rule('html[data-page-transition="fade"]::view-transition-new(root)');
    expect(r).toContain("animation-duration: var(--p-duration-fast)");
    expect(r).toContain("animation-timing-function: var(--p-ease-out)");
    expect(css).toMatch(/html\[data-page-transition="fade"\]::view-transition-old\(root\),\s*html\[data-page-transition="fade"\]::view-transition-new\(root\)/);
  });

  test("slash: the old page stays, the new page wipes in behind an edge at the slash angle", () => {
    expect(rule('html[data-page-transition="slash"]::view-transition-old(root)')).toContain("animation: none");
    const r = rule('html[data-page-transition="slash"]::view-transition-new(root)');
    expect(r).toContain("--p-run: calc(var(--p-slash-run) * 100vh)");
    expect(r).toMatch(/animation: p-page-slash var\(--p-duration-[a-z]+\) var\(--p-ease-wipe\)/);
    // Left to right: the edge starts left of the page and ends right of it; the top leads (never mirrored).
    const k = keyframes("p-page-slash");
    expect(k).toMatch(/from \{\s*clip-path: polygon\(0 0, 0 0, calc\(0px - var\(--p-run\)\) 100%, 0 100%\);/);
    expect(k).toMatch(/to \{\s*clip-path: polygon\(0 0, calc\(100% \+ var\(--p-run\)\) 0, 100% 100%, 0 100%\);/);
  });

  test("slash in RTL: the wipe runs right to left with the same angle", () => {
    expect(rule('html[data-page-transition="slash"][dir="rtl"]::view-transition-new(root)')).toContain("animation-name: p-page-slash-rtl");
    const k = keyframes("p-page-slash-rtl");
    expect(k).toMatch(/from \{\s*clip-path: polygon\(calc\(100% \+ var\(--p-run\)\) 0, 100% 0, 100% 100%, 100% 100%\);/);
    expect(k).toMatch(/to \{\s*clip-path: polygon\(0 0, 100% 0, 100% 100%, calc\(0px - var\(--p-run\)\) 100%\);/);
  });

  test("the animations apply only without reduced motion; reduced motion turns every view transition off", () => {
    const head = "@media (prefers-reduced-motion: no-preference)";
    const motion = block(head, css.lastIndexOf(head, css.indexOf("::view-transition")));
    expect(motion).toContain('html[data-page-transition="slash"]::view-transition-new(root)');
    expect(motion).toContain('html[data-page-transition="fade"]::view-transition-new(root)');
    const reduce = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)/g)].map((m) => block(m[0], m.index)).find((b) => b.includes("::view-transition"));
    expect(reduce).toMatch(
      /html\[data-page-transition\]::view-transition-group\(\*\),\s*html\[data-page-transition\]::view-transition-old\(\*\),\s*html\[data-page-transition\]::view-transition-new\(\*\) \{\s*animation: none;/,
    );
  });
});

describe("slash hover", () => {
  // The wipe needs lh and atan(); the gradient rules apply only where both work.
  const WIPE = "@supports (width: 1lh) and (rotate: atan(1))";
  const wipeAt = () => css.indexOf(WIPE);

  test("a fill in fg at the slash angle (from the token, never mirrored) waits before the start side", () => {
    const r = rule(".p-slash-hover {", wipeAt());
    expect(r).toContain("linear-gradient(calc(90deg + atan(var(--p-slash-run))), var(--p-fg) 50%, transparent 50%)");
    expect(r).toContain("background-repeat: no-repeat");
    expect(r).toContain("background-origin: border-box");
    expect(r).toContain("background-position: 100% 0");
    // The transitions serve the plain fill too: they are on the first rule, outside the @supports.
    const t = rule(".p-slash-hover {");
    expect(t).toMatch(/transition:[^;]*background-position var\(--p-duration-base\) var\(--p-ease-wipe\)/);
    expect(t).toMatch(/transition:[^;]*background-color var\(--p-duration-base\)/);
    expect(t).toMatch(/transition:[^;]*color var\(--p-duration-base\)/);
  });

  test("RTL: the fill waits on the right and runs right to left; the edge keeps its angle", () => {
    const r = rule(".p-slash-hover:dir(rtl) {");
    expect(r).toContain("calc(270deg + atan(var(--p-slash-run)))");
    expect(r).toContain("background-position: 0 0");
    expect(rule(".p-slash-hover:dir(rtl):focus-visible")).toContain("background-position: 100% 0");
  });

  test("hover (only where a pointer can hover) and keyboard focus wipe the fill in; the text turns bg", () => {
    const hover = block("@media (hover: hover)", wipeAt());
    expect(hover).toMatch(/\.p-slash-hover:hover \{\s*background-position: 0 0;/);
    expect(hover).toMatch(/\.p-slash-hover:dir\(rtl\):hover \{\s*background-position: 100% 0;/);
    expect(rule(".p-slash-hover:focus-visible", wipeAt())).toContain("background-position: 0 0");
    // The text, border and underline colours do not need the wipe.
    expect(block("@media (hover: hover)", css.indexOf(".p-slash-hover"))).toMatch(/\.p-slash-hover:hover \{[^}]*color: var\(--p-bg\);/);
    const on = rule(".p-slash-hover:focus-visible");
    expect(on).toContain("color: var(--p-bg)");
    expect(on).toContain("border-color: var(--p-fg)");
    expect(on).toContain("text-decoration-color: currentColor");
  });

  test("the rules are outside the cascade layers, so they win over the Button variants' hover and transition utilities", () => {
    for (const at of [css.indexOf(".p-slash-hover {"), wipeAt()]) {
      expect(at).toBeGreaterThan(0);
      expect(depthAt(at)).toBe(0);
    }
  });

  test("without lh or atan() (Chrome < 111, Safari < 16.4, Firefox < 120): no gradient; the plain fill fades in, as with reduced motion", () => {
    const wipe = block(WIPE);
    expect(wipe).toContain("atan(var(--p-slash-run))");
    expect(wipe).toContain("max(100%, 1lh)");
    // No gradient or lh size outside the @supports block: an old browser drops the whole block.
    expect(css.replace(wipe, "")).not.toMatch(/background[^;]*(atan\(|lh\b)/);
    const plain = block("@supports not ((width: 1lh) and (rotate: atan(1)))");
    expect(depthAt(css.indexOf(plain))).toBe(0);
    expect(plain).toMatch(/\.p-slash-hover:focus-visible \{\s*background-color: var\(--p-fg\);/);
    expect(plain).toMatch(/@media \(hover: hover\) \{\s*\.p-slash-hover:hover \{\s*background-color: var\(--p-fg\);/);
  });

  test("reduced motion: no wipe, the fill fades in", () => {
    const reduce = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)/g)].map((m) => block(m[0], m.index)).find((b) => b.includes(".p-slash-hover"));
    expect(reduce).toMatch(/\.p-slash-hover,\s*\.p-slash-hover:dir\(rtl\) \{\s*background-image: none;/);
    expect(reduce).toMatch(/\.p-slash-hover:focus-visible \{\s*background-color: var\(--p-fg\);/);
  });
});
