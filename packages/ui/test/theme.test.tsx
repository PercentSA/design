import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react";
import { PercentProvider, THEME_SCRIPT, ThemeSwitch, useTheme } from "../src";
import { click, mount, useDom } from "./dom";

useDom();
const root = document.documentElement;
const run = (js: string) => new Function(js)();

afterEach(() => {
  delete root.dataset.theme;
  localStorage.clear();
});

describe("THEME_SCRIPT", () => {
  test("applies the stored choice", () => {
    localStorage.setItem("p-theme", "light");
    run(THEME_SCRIPT);
    expect(root.dataset.theme).toBe("light");
  });
  test("ignores an unknown value", () => {
    root.dataset.theme = "dark";
    localStorage.setItem("p-theme", "bogus");
    run(THEME_SCRIPT);
    expect(root.dataset.theme).toBe("dark");
  });
  test("blocked storage: no error, the page keeps its data-theme", () => {
    root.dataset.theme = "dark";
    const spy = spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      expect(() => run(THEME_SCRIPT)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
    expect(root.dataset.theme).toBe("dark");
  });
});

describe("useTheme", () => {
  test("setTheme with blocked storage still sets the mode", async () => {
    let set: (t: "dark") => void = () => {};
    function Probe() {
      set = useTheme()[1];
      return null;
    }
    await mount(<Probe />);
    const spy = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      await act(async () => expect(() => set("dark")).not.toThrow());
    } finally {
      spy.mockRestore();
    }
    expect(root.dataset.theme).toBe("dark");
  });
});

describe("ThemeSwitch", () => {
  test("three named options in a Theme group; Light sets and stores the mode", async () => {
    const el = await mount(<ThemeSwitch />);
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Theme");
    const radios = [...el.querySelectorAll('[role="radio"]')];
    expect(radios.map((r) => r.textContent)).toEqual(["System", "Light", "Dark"]);
    await click(radios[1]!);
    expect(root.dataset.theme).toBe("light");
    expect(localStorage.getItem("p-theme")).toBe("light");
    expect(radios[1]!.getAttribute("aria-checked")).toBe("true");
  });
  test("Arabic names", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <ThemeSwitch />
      </PercentProvider>,
    );
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("المظهر");
    expect([...el.querySelectorAll('[role="radio"]')].map((r) => r.textContent)).toEqual(["النظام", "فاتح", "داكن"]);
  });
  test("two switches stay in step, and show the page's mode after mount", async () => {
    root.dataset.theme = "dark";
    const el = await mount(
      <>
        <ThemeSwitch />
        <ThemeSwitch />
      </>,
    );
    const checked = () => [...el.querySelectorAll('[aria-checked="true"]')].map((r) => r.textContent);
    expect(checked()).toEqual(["Dark", "Dark"]);
    await click(el.querySelectorAll('[role="radio"]')[0]!);
    expect(checked()).toEqual(["System", "System"]);
  });
  test("server render: no window access, nothing checked (no hydration mismatch)", () => {
    root.dataset.theme = "light";
    const out = renderToStaticMarkup(<ThemeSwitch />);
    expect(out).toContain('role="radiogroup"');
    expect(out).not.toContain('aria-checked="true"');
  });
});
