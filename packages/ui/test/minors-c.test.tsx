import { describe, expect, test } from "bun:test";
import { act, useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar, Combobox, PercentProvider, SiteHeader, toast, Toaster, type PlainDate } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();
const noop = () => {};

const CITIES = [
  { value: "ruh", label: "Riyadh" },
  { value: "jed", label: "Jeddah" },
  { value: "dmm", label: "Dammam" },
  { value: "jaz", label: "Jazan" },
];

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

// The option aria-activedescendant points at; it must also be the one drawn as highlighted.
const highlighted = (input: HTMLInputElement) => {
  const id = input.getAttribute("aria-activedescendant");
  const option = id ? document.getElementById(id) : null;
  expect(option?.hasAttribute("data-highlighted") ?? false).toBe(option !== null);
  return option?.textContent ?? null;
};

describe("C1 Combobox: the highlight starts where WAI-ARIA says", () => {
  test("nothing chosen: ArrowDown opens on the first item, ArrowUp on the last", async () => {
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={noop} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await press(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(highlighted(input)).toBe("Riyadh");
    await press(input, { key: "Escape" });
    await press(input, { key: "ArrowUp" });
    expect(highlighted(input)).toBe("Jazan");
  });

  test("an item chosen: ArrowDown and ArrowUp open on the chosen item", async () => {
    await mount(<Combobox aria-label="City" options={CITIES} value="dmm" onValueChange={noop} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await press(input, { key: "ArrowDown" });
    expect(highlighted(input)).toBe("Dammam");
    await press(input, { key: "Escape" });
    await press(input, { key: "ArrowUp" });
    expect(highlighted(input)).toBe("Dammam");
  });

  test("after a filter: the first match, then the next; after Escape the full list starts again", async () => {
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={noop} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await type(input, "j");
    expect(highlighted(input)).toBe("Jeddah");
    await press(input, { key: "ArrowDown" });
    expect(highlighted(input)).toBe("Jazan");
    await press(input, { key: "Escape" });
    await press(input, { key: "ArrowDown" });
    expect(highlighted(input)).toBe("Riyadh");
  });
});

describe("C2 Calendar alone: the view follows a new value from outside", () => {
  function Outside() {
    const [value, setValue] = useState<PlainDate | null>("2026-02-18");
    return (
      <>
        <button type="button" id="jump" onClick={() => setValue("2026-05-10")}>
          jump
        </button>
        <Calendar value={value} onValueChange={setValue} fixedCalendar />
      </>
    );
  }
  const month = () => document.querySelector('[role="grid"]')!.getAttribute("aria-label");

  test("a value in another month moves the view there; the month buttons still work", async () => {
    await mount(<Outside />);
    expect(month()).toBe("February 2026");
    await click(document.getElementById("jump")!);
    expect(month()).toBe("May 2026");
    expect(document.querySelector('[data-day][tabindex="0"]')!.getAttribute("data-day")).toBe("2026-05-10");
    await click(document.querySelector('[aria-label="Next month"]')!);
    expect(month()).toBe("June 2026");
  });
});

describe("C3 toast without a Toaster", () => {
  test("a toast made while no Toaster is mounted is not kept", async () => {
    let id = 0;
    expect(() => (id = toast({ title: "Old toast" }))).not.toThrow();
    expect(id).toBeGreaterThan(0);
    await mount(<Toaster />);
    expect(document.body.textContent).not.toContain("Old toast");
  });

  test("a toast from a mount effect is shown, also when the Toaster comes later in the tree", async () => {
    function Flash() {
      useEffect(() => void toast({ title: "Saved on load" }), []);
      return null;
    }
    await mount(
      <>
        <Flash />
        <Toaster />
      </>,
    );
    expect(document.body.textContent).toContain("Saved on load");
  });
});

describe("C4 SiteHeader: the two navs have different names", () => {
  const links = [{ href: "/en#work", label: "Work" }];
  const navNames = (out: string) => [...out.matchAll(/<nav aria-label="([^"]+)"/g)].map((m) => m[1]);

  test("desktop nav is the main navigation; the phone menu keeps Menu (EN and AR)", () => {
    expect(navNames(renderToStaticMarkup(<SiteHeader homeHref="/en" links={links} />))).toEqual(["Main navigation", "Menu"]);
    const ar = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <SiteHeader homeHref="/ar" links={links} />
      </PercentProvider>,
    );
    expect(navNames(ar)).toEqual(["التنقل الرئيسي", "القائمة"]);
  });
});
