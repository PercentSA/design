// Combobox server search, long lists and "add new" (0.8.0).
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Combobox, PercentProvider, type ComboboxOption } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();
const noop = () => {};

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
const optionTexts = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);
const highlighted = () => document.getElementById(input().getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;

describe("Combobox server search", () => {
  test("onQueryChange gets each query; options show as given", async () => {
    const queries: string[] = [];
    // The results do not contain the query: with onQueryChange there is no local filter.
    const options = [
      { value: "1", label: "Al Rajhi Bank" },
      { value: "2", label: "Riyad Bank" },
    ];
    await mount(<Combobox aria-label="Bank" options={options} value={null} onValueChange={noop} onQueryChange={(q) => queries.push(q)} />);
    await type(input(), "x");
    await type(input(), "xy");
    expect(queries).toEqual(["x", "xy"]);
    expect(optionTexts()).toEqual(["Al Rajhi Bank", "Riyad Bank"]);
  });

  test("loading shows Searching and aria-busy", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Combobox aria-label="Bank" options={[]} value={null} onValueChange={noop} onQueryChange={noop} loading />
      </PercentProvider>,
    );
    await type(input(), "ر");
    const list = document.querySelector('[role="listbox"]')!;
    expect(list.getAttribute("aria-busy")).toBe("true");
    expect(list.textContent).toContain("جارٍ البحث");
    expect(list.textContent).not.toContain("لا توجد نتائج");
  });

  test("the chosen value keeps its label when options change", async () => {
    function Search() {
      const [value, setValue] = useState<string | null>(null);
      const [options, setOptions] = useState<ComboboxOption[]>([{ value: "ruh", label: "Riyadh" }]);
      return (
        <Combobox
          aria-label="City"
          options={options}
          value={value}
          onValueChange={(v) => {
            setValue(v);
            // New results arrive after the choice; the chosen city is not among them.
            setOptions([{ value: "jed", label: "Jeddah" }]);
          }}
          onQueryChange={noop}
        />
      );
    }
    await mount(<Search />);
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(input().value).toBe("Riyadh");

    // A value that was never in the options shows valueLabel.
    document.body.innerHTML = "";
    await mount(<Combobox aria-label="City" options={[]} value="dmm" valueLabel="Dammam" onValueChange={noop} onQueryChange={noop} />);
    expect(input().value).toBe("Dammam");
  });
});

describe("Combobox add new", () => {
  const CITIES = [
    { value: "ruh", label: "Riyadh" },
    { value: "abha", label: "أبها" },
  ];

  test("Add «q» is reachable with the arrows; Enter calls onCreate(\"q\")", async () => {
    const created: string[] = [];
    const chosen: string[] = [];
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={(v) => chosen.push(v)} onCreate={(q) => created.push(q)} />);
    await type(input(), "Riy");
    // The Add option is the last one: after the match, then ArrowUp from the first wraps to it.
    expect(optionTexts()).toEqual(["Riyadh", 'Add "Riy"']);
    expect(highlighted()).toBe("Riyadh");
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toBe('Add "Riy"');
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toBe("Riyadh");
    await press(input(), { key: "ArrowUp" });
    expect(highlighted()).toBe('Add "Riy"');
    await press(input(), { key: "Enter" });
    expect(created).toEqual(["Riy"]);
    expect(chosen).toEqual([]);
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  test("no Add option when an option matches (أ and ا count as the same letter)", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Combobox aria-label="City" options={CITIES} value={null} onValueChange={noop} onCreate={noop} />
      </PercentProvider>,
    );
    await type(input(), "ابها");
    expect(optionTexts()).toEqual(["أبها"]);
    await type(input(), "تبوك");
    expect(optionTexts()).toEqual(["إضافة «تبوك»"]);
    await type(input(), " ");
    expect(optionTexts()).toEqual(["Riyadh", "أبها"]);
  });
});

test("limit 50: 50 options and a row that is not an option", async () => {
  const options = Array.from({ length: 120 }, (_, i) => ({ value: `c${i}`, label: `City ${i}` }));
  await mount(<Combobox aria-label="City" options={options} value={null} onValueChange={noop} limit={50} />);
  await click(input());
  expect(optionTexts()).toHaveLength(50);
  const list = document.querySelector('[role="listbox"]')!;
  const more = [...list.children].find((el) => el.textContent === "70 more. Type to narrow the list.");
  expect(more).toBeDefined();
  expect(more!.getAttribute("role")).not.toBe("option");
  // The arrows wrap inside the 50 options and never land on the row.
  await press(input(), { key: "ArrowUp" });
  expect(highlighted()).toBe("City 49");
  // Fewer matches than the limit: all show, and the row goes away.
  await type(input(), "City 11");
  expect(optionTexts()).toEqual(["City 11", "City 110", "City 111", "City 112", "City 113", "City 114", "City 115", "City 116", "City 117", "City 118", "City 119"]);
  expect(list.textContent).not.toContain("more.");
});
