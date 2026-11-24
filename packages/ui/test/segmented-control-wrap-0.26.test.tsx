import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, SegmentedControl } from "../src";

const options = [
  { value: "a", label: "All 12" },
  { value: "b", label: "Orders 4" },
];
const html = (wrap?: boolean) =>
  renderToStaticMarkup(
    <PercentProvider lang="en">
      <SegmentedControl aria-label="Kind" defaultValue="a" options={options} {...(wrap === undefined ? {} : { wrap })} />
    </PercentProvider>,
  );

describe("SegmentedControl wrap", () => {
  test("with wrap the group wraps", () => {
    expect(html(true)).toMatch(/role="radiogroup" class="[^"]*\bflex-wrap\b/);
  });
  test("with wrap no wrap attribute reaches the DOM", () => {
    expect(html(true)).not.toMatch(/\swrap=/);
  });
  test("without wrap the markup does not change", () => {
    expect(html(false)).toBe(html());
    expect(html()).not.toContain("flex-wrap");
    expect(html()).not.toMatch(/\swrap=/);
  });
});
