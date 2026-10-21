import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LOGO_VERSIONS, logoLayout } from "@percentsa/tokens";
import { Logo, PercentProvider } from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);

describe("Logo", () => {
  test.each(LOGO_VERSIONS)("%s: viewBox, currentColor, hidden from screen readers", (v) => {
    const out = html(<Logo version={v} />);
    expect(out).toContain(`viewBox="${logoLayout(v).viewBox.join(" ")}"`);
    expect(out).toContain('fill="currentColor"');
    expect(out).toContain('aria-hidden="true"');
    expect(out.match(/<path /g)!.length).toBe(logoLayout(v).parts.length);
  });

  test("a label makes it an image", () => {
    const out = html(<Logo version="icon-en" label="Percent" />);
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Percent"');
    expect(out).not.toContain("aria-hidden");
  });

  test("no colour literals", () => {
    for (const v of LOGO_VERSIONS) expect(html(<Logo version={v} />)).not.toContain("#");
  });

  test("same output in RTL: never mirrored", () => {
    for (const v of LOGO_VERSIONS)
      expect(html(<PercentProvider lang="ar"><Logo version={v} /></PercentProvider>)).toBe(html(<PercentProvider lang="en"><Logo version={v} /></PercentProvider>));
  });
});
