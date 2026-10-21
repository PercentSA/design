import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  Calendar,
  cn,
  Combobox,
  CrInput,
  Dialog,
  IbanInput,
  MENU_ITEM,
  NationalAddress,
  NumberInput,
  PasswordInput,
  PercentProvider,
  PhoneInput,
  SegmentedControl,
  SiteFooter,
} from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();
const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const noop = () => {};

describe("fresh-review fixes (ui)", () => {
  test("Calendar: after the month buttons, arrow keys move inside the new month", async () => {
    const el = await mount(<Calendar value="2026-02-18" onValueChange={noop} />);
    await click(el.querySelector('[aria-label="Next month"]')!);
    const stop = el.querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')!;
    await act(async () => stop.focus());
    await press(stop, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-03-02");
  });

  test("Combobox in a dialog: Escape closes the list, not the dialog", async () => {
    await mount(
      <Dialog defaultOpen title="Filters">
        <Combobox aria-label="City" options={[{ value: "ruh", label: "Riyadh" }]} value={null} onValueChange={noop} />
      </Dialog>,
    );
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await click(input);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    await press(input, { key: "Escape" });
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  test("SegmentedControl without value keeps one item chosen when the chosen item is clicked", async () => {
    const el = await mount(<SegmentedControl aria-label="Billing" defaultValue="year" options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }]} />);
    const yearly = [...el.querySelectorAll("button")].find((b) => b.textContent === "Yearly")!;
    await click(yearly);
    expect(yearly.getAttribute("data-state")).toBe("on");
  });

  test("PhoneInput in Arabic: the dial code in the country menu keeps its + before the digits", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <PhoneInput value="" onValueChange={noop} country="SA" onCountryChange={noop} />
      </PercentProvider>,
    );
    await press(el.querySelector('[role="combobox"]')!, { key: "ArrowDown" });
    const option = document.querySelector('[role="option"]')!;
    expect(option.innerHTML).toMatch(/dir="ltr"[^>]*>\(\+966\)/);
  });

  test("special inputs keep the app's className", () => {
    expect(html(<IbanInput className="w-40" value="" onValueChange={noop} />)).toContain("w-40");
    expect(html(<NumberInput className="w-40" value={1} onValueChange={noop} />)).toContain("w-40");
    expect(html(<CrInput className="w-40" value="" onValueChange={noop} />)).toContain("w-40");
    const pw = html(<PasswordInput className="w-40" />);
    expect([pw.includes("w-40"), pw.includes("pe-1.5")]).toEqual([true, true]);
  });

  test("pasted numbers with spaces are not cut by maxlength (the normalizers cut to length)", () => {
    expect(html(<CrInput value="" onValueChange={noop} />)).not.toContain("maxLength");
    expect(html(<IbanInput value="" onValueChange={noop} />)).not.toContain("maxLength");
    expect(html(<NationalAddress value={{}} onValueChange={noop} />)).not.toMatch(/maxLength="[45]"/);
  });

  test("a loading button keeps its name and focus, says it is loading, and does not submit", async () => {
    const out = html(<Button loading>Send</Button>);
    expect(out).toContain('aria-disabled="true"');
    expect(out).not.toMatch(/ disabled=""/);
    expect(out).not.toContain("invisible");
    expect(out).toContain("Loading");
    let submitted = 0;
    const el = await mount(
      <form onSubmit={(e) => (e.preventDefault(), submitted++)}>
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    );
    await click(el.querySelector("button")!);
    expect(submitted).toBe(0);
  });

  test("NumberInput step buttons at the limit stay focusable", () => {
    const out = html(<NumberInput value={0} min={0} onValueChange={noop} />);
    expect(out).toMatch(/aria-label="Decrease"[^>]*aria-disabled="true"|aria-disabled="true"[^>]*aria-label="Decrease"/);
    expect(out).not.toMatch(/ disabled=""/);
  });

  test("cn: a later radius or shadow utility replaces the token one", () => {
    expect(cn("rounded-card", "rounded-none")).toBe("rounded-none");
    expect(cn("rounded-pill p-2", "rounded-2xl")).toBe("p-2 rounded-2xl");
    expect(cn("shadow-overlay", "shadow-none")).toBe("shadow-none");
  });

  test("the highlighted menu item has a visible background in both themes", () => {
    expect(MENU_ITEM).toContain("data-highlighted:bg-fg/10");
  });

  describe("SiteFooter year", () => {
    afterEach(() => void setSystemTime());
    test("is the year in Riyadh, so server and browser agree on New Year's Eve", () => {
      setSystemTime(new Date("2026-12-31T22:00:00Z"));
      expect(html(<SiteFooter homeHref="/" links={[]} />)).toContain("© 2027");
    });
  });
});
