import { afterEach, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { act, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrintArea, STRINGS, usePrint } from "../src";
import { mount, useDom } from "./dom";

useDom();

const realPrint = window.print;
afterEach(() => {
  window.print = realPrint;
});

type Api = ReturnType<typeof usePrint>;
let api: Api;
let areas: { a: HTMLDivElement | null; b: HTMLDivElement | null };

function Page({ two }: { two?: boolean }) {
  api = usePrint();
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  areas = { get a() { return a.current; }, get b() { return b.current; } };
  return (
    <>
      <p>The page</p>
      <PrintArea ref={a} orientation="landscape" header={<h1>Orders</h1>}>
        <p>Rows</p>
      </PrintArea>
      {two && (
        <PrintArea ref={b}>
          <p>Other</p>
        </PrintArea>
      )}
    </>
  );
}

const marks = () => ({
  printing: document.documentElement.hasAttribute("data-printing"),
  active: document.querySelectorAll("[data-print-active]").length,
  style: document.querySelectorAll("style[data-print-page]").length,
});
const clean = { printing: false, active: 0, style: 0 };

describe("PrintArea", () => {
  test("server render: nothing", () => {
    expect(renderToStaticMarkup(<PrintArea>x</PrintArea>)).toBe("");
  });

  test("after mount the area is a child of body, hidden on screen, header in a thead", async () => {
    await mount(<Page />);
    const area = areas.a!;
    expect(area.parentElement).toBe(document.body);
    expect(area.hasAttribute("data-print-area")).toBe(true);
    expect(area.getAttribute("data-orientation")).toBe("landscape");
    expect(area.classList.contains("hidden")).toBe(true);
    expect(area.querySelector("thead h1")?.textContent).toBe("Orders");
    expect(area.querySelector("tbody")?.textContent).toBe("Rows");
    // White paper in every theme, as the invoice.
    expect(area.className).toContain("print:bg-white");
  });
});

describe("usePrint", () => {
  test("print(): marks <html> and the area, adds the A4 landscape page rule, calls window.print once", async () => {
    let seen: ReturnType<typeof marks> | undefined;
    const print = mock(() => {
      seen = marks();
    });
    window.print = print;
    await mount(<Page />);
    await act(() => api.print(areas.a));
    expect(print).toHaveBeenCalledTimes(1);
    expect(seen).toEqual({ printing: true, active: 1, style: 1 });
    expect(areas.a!.hasAttribute("data-print-active")).toBe(true);
    const rule = document.querySelector("style[data-print-page]")!.textContent!;
    expect(rule).toContain("size: A4 landscape");
    expect(rule).toContain("margin: 12mm");
    expect(rule).toContain('counter(page) " / " counter(pages); direction: ltr');
    expect(api.printing).toBe(true);
    // A second call while printing is ignored.
    await act(() => api.print(areas.a));
    expect(print).toHaveBeenCalledTimes(1);
    await act(async () => {
      window.dispatchEvent(new Event("afterprint"));
    });
  });

  test("afterprint restores the page and printing becomes false", async () => {
    window.print = mock(() => {});
    await mount(<Page />);
    await act(() => api.print(areas.a));
    expect(marks()).toEqual({ printing: true, active: 1, style: 1 });
    await act(async () => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(marks()).toEqual(clean);
    expect(api.printing).toBe(false);
  });

  test("a failed print restores the page", async () => {
    window.print = mock(() => {
      throw new Error("blocked");
    });
    await mount(<Page />);
    let error: unknown;
    await act(() => api.print(areas.a).catch((e) => void (error = e)));
    expect((error as Error).message).toBe("blocked");
    expect(marks()).toEqual(clean);
    expect(api.printing).toBe(false);
  });

  test("only the chosen area prints", async () => {
    let seen: { a: boolean; b: boolean } | undefined;
    window.print = mock(() => {
      seen = { a: areas.a!.hasAttribute("data-print-active"), b: areas.b!.hasAttribute("data-print-active") };
    });
    await mount(<Page two />);
    await act(() => api.print(areas.b));
    expect(seen).toEqual({ a: false, b: true });
    // The default orientation is portrait.
    expect(document.querySelector("style[data-print-page]")!.textContent).toContain("size: A4 portrait");
    await act(async () => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(marks()).toEqual(clean);
    // Everything else in body (the page, an open sheet, toasts) is hidden in print.
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    expect(css).toContain("html[data-printing] body > :not([data-print-active])");
  });

  test("tooManyRowsToPrint in both languages", () => {
    expect(STRINGS.en.tooManyRowsToPrint(500)).toBe("More than 500 rows. Export the list, or filter it.");
    expect(STRINGS.ar.tooManyRowsToPrint(500)).toBe("أكثر من 500 صف. صدّر القائمة أو ضيّق التصفية.");
  });
});
