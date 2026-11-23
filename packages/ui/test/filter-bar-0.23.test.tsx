import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { FilterBar, PercentProvider, type FilterDef, type FilterValue } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

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

describe("FilterBar 0.23 fixes", () => {
  test("Enter in an input-method composition does not call onSubmit", async () => {
    submitted = [];
    const el = await mount(<Harness search={{ onSubmit: (v: string) => submitted.push(v) }} />);
    await press(input(el), { key: "Enter", isComposing: true });
    await press(input(el), { key: "Enter", keyCode: 229 });
    expect(submitted).toEqual([]);
    const el2 = await mount(<Harness search={{ suggestions: ["nginx"], onSubmit: (v: string) => submitted.push(v) }} />);
    const field = el2.querySelector("input")!;
    await press(field, { key: "Enter", isComposing: true });
    expect(submitted).toEqual([]);
  });

  test("Enter on a highlighted suggestion chooses it and does not call onSubmit", async () => {
    submitted = [];
    const el = await mount(<Harness search={{ suggestions: ["nginx", "postgres"], onSubmit: (v: string) => submitted.push(v) }} />);
    await type(input(el), "ngi");
    await press(input(el), { key: "ArrowDown" });
    await press(input(el), { key: "Enter" });
    expect(input(el).value).toBe("nginx");
    expect(submitted).toEqual([]);
  });

  test("Clear filters removes keys that are not filters, as 0.22.0 did, and turns off pressed toggles", async () => {
    const el = await mount(<Harness initial={{ level: ["info"], errors: ["on"], gone: ["x"] }} />);
    const clear = [...el.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")!;
    await click(clear);
    expect(last).toEqual({ level: [], errors: [] });
    expect(chip(el).getAttribute("aria-pressed")).toBe("false");
  });

  test("maxLength is on the input together with suggestions", async () => {
    const el = await mount(<Harness search={{ suggestions: ["nginx"], maxLength: 20 }} />);
    expect(input(el).maxLength).toBe(20);
    expect(input(el).getAttribute("role")).toBe("combobox");
  });

  test("the suggestions field has the same search defaults as the plain field", async () => {
    const plain = input(await mount(<Harness />));
    const sugg = input(await mount(<Harness search={{ suggestions: ["a"] }} />));
    for (const a of ["type", "enterkeyhint", "aria-label", "placeholder"]) expect(sugg.getAttribute(a)).toBe(plain.getAttribute(a));
  });
});
