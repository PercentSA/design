import { afterEach, describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { DataTable, FilterBar, PercentProvider, type FilterDef, type FilterValue } from "../src";
import { click, mount, press, stubMatchMedia, useDom } from "./dom";

useDom();
afterEach(() => localStorage.clear());

const FILTERS: FilterDef[] = [
  { key: "level", label: "Level", options: [{ value: "info", label: "Info" }] },
  { key: "errors", label: "Errors only", kind: "toggle", options: [] },
];
let last: FilterValue = {};
let submitted: string[] = [];
function Harness({ filters = FILTERS, collapse, search = {}, initial = {} }: { filters?: FilterDef[]; collapse?: boolean; search?: object; initial?: FilterValue }) {
  const [value, setValue] = useState<FilterValue>(initial);
  const [text, setText] = useState("");
  return (
    <PercentProvider lang="en">
      <FilterBar
        collapseOnPhone={collapse}
        filters={filters}
        value={value}
        onValueChange={(v) => {
          last = v;
          setValue(v);
        }}
        search={{ value: text, onValueChange: setText, placeholder: "Search", ...search }}
      />
    </PercentProvider>
  );
}
const chip = (el: Element) => [...el.querySelectorAll("button")].find((b) => b.textContent === "Errors only")!;
const input = (el: Element) => el.querySelector("input")!;
const type = (el: HTMLInputElement, v: string) =>
  act(async () => {
    el.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("FilterBar 0.23", () => {
  test("as before: menu filters and a plain search input", async () => {
    const el = await mount(<Harness filters={[FILTERS[0]!]} />);
    expect([...el.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Level"]);
    expect(el.querySelector("[aria-pressed]")).toBeNull();
    expect(input(el).getAttribute("role")).toBeNull();
    expect(input(el).type).toBe("search");
  });

  test("toggle filter: a press sets on, a second press clears; aria-pressed follows; no tag", async () => {
    const el = await mount(<Harness />);
    expect(chip(el).getAttribute("aria-pressed")).toBe("false");
    await click(chip(el));
    expect(last.errors).toEqual(["on"]);
    expect(chip(el).getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector("svg.lucide-check")).not.toBeNull();
    expect(el.textContent).not.toContain("Clear filters");
    await click(chip(el));
    expect(last.errors).toEqual([]);
    expect(chip(el).getAttribute("aria-pressed")).toBe("false");
  });

  test("toggle filter: on a phone with collapseOnPhone it stays on the bar and is not in the sheet", async () => {
    const el = await mount(<Harness collapse />);
    expect(chip(el).className).not.toContain("max-md:hidden");
    const open = [...el.querySelectorAll("button")].find((b) => b.className.includes("md:hidden") && b.textContent === "Filters")!;
    await click(open);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect([...dialog.querySelectorAll("legend")].map((l) => l.textContent)).toEqual(["Level"]);
  });

  test("search onSubmit runs on Enter with the text; typing alone does not", async () => {
    submitted = [];
    const el = await mount(<Harness search={{ onSubmit: (v: string) => submitted.push(v) }} />);
    await type(input(el), "boot");
    expect(submitted).toEqual([]);
    await press(input(el), { key: "Enter" });
    expect(submitted).toEqual(["boot"]);
  });

  test("search suggestions show in a list; a choice sets the value; free text stays", async () => {
    submitted = [];
    const el = await mount(<Harness search={{ suggestions: ["nginx", "postgres"], onSubmit: (v: string) => submitted.push(v) }} />);
    expect(input(el).getAttribute("role")).toBe("combobox");
    await type(input(el), "ngi");
    const options = [...document.querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.textContent)).toEqual(["nginx"]);
    await click(options[0]!);
    expect(input(el).value).toBe("nginx");
    await type(input(el), "zzz");
    expect(input(el).value).toBe("zzz");
    await press(input(el), { key: "Enter" });
    expect(submitted).toEqual(["zzz"]);
  });

  test("search maxLength is on the input", async () => {
    const el = await mount(<Harness search={{ maxLength: 20 }} />);
    expect(input(el).maxLength).toBe(20);
  });
});

describe("DataTable 0.23 phone toolbar row", () => {
  const table = (props: object) => (
    <PercentProvider lang="en">
      <DataTable cards columns={[{ key: "n", header: "Name" }]} rows={[{ id: "a", n: "Al Noor" }]} getRowId={(r) => r.id} caption="Apps" {...props} />
    </PercentProvider>
  );
  test("as before: no viewKey and no toolbar draws no row", async () => {
    const el = await mount(table({}));
    expect(el.querySelector(".pb-4")).toBeNull();
  });
  test("viewKey without toolbar: the row is hidden below 768 px", async () => {
    stubMatchMedia(true);
    const el = await mount(table({ viewKey: "x" }));
    expect(el.querySelector(".pb-4")!.className).toContain("max-md:hidden");
  });
  test("viewKey with toolbar: the row stays", async () => {
    const el = await mount(table({ viewKey: "x", toolbar: <span>T</span> }));
    expect(el.querySelector(".pb-4")!.className).not.toContain("max-md:hidden");
  });
});
