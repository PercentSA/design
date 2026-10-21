import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { readFileSync } from "node:fs";
import { Accordion } from "../src/components/accordion";
import { Checkbox, Combobox } from "../src";
import { mount, press, useDom } from "./dom";

useDom();
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const noop = () => {};

describe("0.2.1 review fixes", () => {
  const items = [
    { value: "a", title: "Pricing", content: "From 5,000" },
    { value: "b", title: "Timeline", content: "Six weeks" },
  ];
  const panels = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="region"]')];

  test("Accordion: a browser without find-in-page reveal keeps closed panels plainly hidden (display: grid would show them)", async () => {
    expect("onbeforematch" in document.body).toBe(false);
    const el = await mount(<Accordion items={items} defaultValue="b" />);
    expect(panels(el)[0]!.getAttribute("hidden")).toBe("");
    expect(css).toMatch(/\.p-accordion\[hidden\]:not\(\[hidden="until-found"\]\) \{\s*display: none;/);
  });

  test("Accordion: an item that becomes disabled while closed is no longer found by find-in-page", async () => {
    Object.defineProperty(HTMLElement.prototype, "onbeforematch", { value: null, configurable: true, writable: true });
    try {
      let set = (_: boolean) => {};
      function T() {
        const [disabled, setDisabled] = useState(false);
        set = setDisabled;
        return <Accordion items={[items[0]!, { ...items[1]!, disabled }]} defaultValue="a" />;
      }
      const el = await mount(<T />);
      expect(panels(el)[1]!.getAttribute("hidden")).toBe("until-found");
      await act(async () => set(true));
      expect(panels(el)[1]!.getAttribute("hidden")).toBe("");
    } finally {
      delete (HTMLElement.prototype as { onbeforematch?: unknown }).onbeforematch;
    }
  });

  test("Checkbox with a description keeps the app's own aria-label as its name", async () => {
    const el = await mount(<Checkbox aria-label="Accept the terms" label="Terms" description="Read them first" />);
    const box = el.querySelector('[role="checkbox"]')!;
    expect(box.getAttribute("aria-label")).toBe("Accept the terms");
    expect(box.hasAttribute("aria-labelledby")).toBe(false);
    expect(box.getAttribute("aria-describedby")).toBeTruthy();
  });

  test("Combobox: the highlighted option is scrolled into view", async () => {
    const scrolled: Element[] = [];
    const saved = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
    try {
      const options = Array.from({ length: 30 }, (_, i) => ({ value: `c${i}`, label: `City ${i}` }));
      const el = await mount(<Combobox aria-label="City" options={options} value="c25" onValueChange={noop} />);
      await press(el.querySelector('[role="combobox"]')!, { key: "ArrowDown" });
      const active = document.getElementById(el.querySelector('[role="combobox"]')!.getAttribute("aria-activedescendant")!)!;
      expect(active.textContent).toContain("City 25");
      expect(scrolled.includes(active)).toBe(true);
    } finally {
      Element.prototype.scrollIntoView = saved;
    }
  });
});
