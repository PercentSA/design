import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs } from "../src";

describe("tabs fit", () => {
  test("Tabs root and panels can shrink below their content", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <Tabs
          className="extra"
          defaultValue="a"
          items={[
            { value: "a", label: "A", content: "One" },
            { value: "b", label: "B", content: "Two" },
          ]}
        />,
      ),
      "text/html",
    );
    const root = doc.querySelector("[dir], div")!;
    expect(root.classList.contains("min-w-0")).toBe(true);
    expect(root.classList.contains("grid-cols-[minmax(0,1fr)]")).toBe(true);
    expect(root.classList.contains("extra")).toBe(true);
    const panels = doc.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBeGreaterThan(0);
    for (const p of panels) expect(p.classList.contains("min-w-0")).toBe(true);
  });
});
