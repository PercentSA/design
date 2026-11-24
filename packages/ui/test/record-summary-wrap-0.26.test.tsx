import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, RecordSummary } from "../src";

const text = "Stays closed until the review ends";
const html = (wrap?: boolean) =>
  renderToStaticMarkup(
    <PercentProvider lang="en">
      <RecordSummary items={[{ id: "next", label: "Next", value: text, ...(wrap === undefined ? {} : { wrap }) }]} />
    </PercentProvider>,
  );
const dd = (h: string) => new DOMParser().parseFromString(h, "text/html").querySelector("dd")!;

describe("RecordSummary item wrap", () => {
  test("an item with wrap shows its whole value", () => {
    const h = html(true);
    expect(h).not.toContain("line-clamp-2");
    expect(h).toContain("break-words");
    expect(dd(h).hasAttribute("title")).toBe(false);
  });
  test("without wrap the value keeps the 2-line cut and the title", () => {
    for (const h of [html(), html(false)]) {
      expect(h).toContain("line-clamp-2");
      expect(dd(h).getAttribute("title")).toBe(text);
    }
    expect(html(false)).toBe(html());
  });
});
