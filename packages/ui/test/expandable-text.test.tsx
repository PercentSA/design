import { afterEach, describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, ExpandableText, PercentProvider } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const proto = HTMLElement.prototype;
const saved = { scrollHeight: Object.getOwnPropertyDescriptor(proto, "scrollHeight"), clientHeight: Object.getOwnPropertyDescriptor(proto, "clientHeight") };
const stub = (scroll: number, client: number) => {
  Object.defineProperty(proto, "scrollHeight", { configurable: true, get: () => scroll });
  Object.defineProperty(proto, "clientHeight", { configurable: true, get: () => client });
};
afterEach(() => {
  for (const key of ["scrollHeight", "clientHeight"] as const) {
    if (saved[key]) Object.defineProperty(proto, key, saved[key]!);
    else delete (proto as unknown as Record<string, unknown>)[key];
  }
});

const LONG = "Build failed: the step could not read the file because the path is too long.";

describe("ExpandableText", () => {
  test("a cut text is a button that opens and closes", async () => {
    stub(40, 20);
    const el = await mount(<ExpandableText text={LONG} />);
    const button = el.querySelector("button")!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.querySelector("[aria-hidden]")).not.toBeNull();
    expect(el.innerHTML).toContain("overflow: hidden");
    await click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(el.innerHTML).not.toContain("overflow: hidden");
    expect(button.querySelector("span")!.className).toContain("whitespace-pre-wrap");
    expect(button.textContent).toContain(LONG);
    await click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  test("it is a native button, so Enter and Space work", async () => {
    stub(40, 20);
    const el = await mount(<ExpandableText text={LONG} />);
    expect(el.querySelector("button")!.getAttribute("type")).toBe("button");
  });

  test("a text that fits and has no details is plain text", async () => {
    stub(20, 20);
    const el = await mount(<ExpandableText text="Short" />);
    expect(el.querySelector("button")).toBeNull();
    expect(el.textContent).toBe("Short");
  });

  test("details show only when open, outside the button", async () => {
    stub(20, 20);
    const el = await mount(<ExpandableText text="Short" details={<code id="d">job 4f2a</code>} />);
    expect(el.querySelector("#d")).toBeNull();
    const button = el.querySelector("button")!;
    await click(button);
    const details = el.querySelector("#d")!;
    expect(details).not.toBeNull();
    expect(button.contains(details)).toBe(false);
  });

  test("lines sets the clamp", async () => {
    // The test DOM drops the line-clamp property, so read the server markup.
    expect(renderToStaticMarkup(<ExpandableText text={LONG} lines={2} />)).toContain("-webkit-line-clamp:2");
    expect(renderToStaticMarkup(<ExpandableText text={LONG} />)).toContain("-webkit-line-clamp:1");
  });

  test("inside a DataTable row with rowHref, the button is not inside the row link", async () => {
    stub(40, 20);
    const A = ({ href, ...rest }: ComponentProps<"a">) => <a href={href} {...rest} />;
    const el = await mount(
      <PercentProvider lang="en" link={A}>
        <DataTable
          caption="Builds"
          columns={[{ key: "id", header: "Build" }, { key: "error", header: "Error", cell: (r: { error: string }) => <ExpandableText text={r.error} /> }]}
          rows={[{ id: "1", error: LONG }]}
          getRowId={(r) => r.id}
          rowHref={(r) => `/builds/${r.id}`}
        />
      </PercentProvider>,
    );
    const button = el.querySelector("tbody button")!;
    expect(button.closest("a")).toBeNull();
    expect(button.closest("tr")!.className).toContain(":is(a,button,");
  });

  test("the button is at least 24 px high, also in a table", async () => {
    stub(40, 20);
    const el = await mount(<ExpandableText text={LONG} />);
    expect(el.querySelector("button")!.className).toContain("min-h-6");
  });

  test("a long word without spaces wraps inside the clamp, so a path or hash gets the button", () => {
    const html = renderToStaticMarkup(<ExpandableText text={"/srv/apps/" + "a".repeat(200)} />);
    expect(html).toMatch(/class="[^"]*break-words[^"]*" style="display:-webkit-box/);
  });

  test("a text that fits at first becomes a button when it is cut later (resize)", async () => {
    const observers: { cb: () => void; els: Element[] }[] = [];
    const Original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      o: { cb: () => void; els: Element[] };
      constructor(cb: () => void) { this.o = { cb, els: [] }; observers.push(this.o); }
      observe(el: Element) { this.o.els.push(el); }
      unobserve() {}
      disconnect() { this.o.els = []; }
    } as never;
    try {
      stub(20, 20);
      const el = await mount(<ExpandableText text={LONG} />);
      expect(el.querySelector("button")).toBeNull();
      const live = observers.filter((o) => o.els.some((e) => e.isConnected));
      expect(live.length).toBe(1);
      stub(40, 20);
      const { act } = await import("react");
      await act(async () => live[0]!.cb());
      expect(el.querySelector("button")).not.toBeNull();
    } finally {
      globalThis.ResizeObserver = Original;
    }
  });

  test("it works without ResizeObserver", async () => {
    stub(40, 20);
    const Original = globalThis.ResizeObserver;
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    try {
      const el = await mount(<ExpandableText text={LONG} />);
      expect(el.querySelector("button")).not.toBeNull();
    } finally {
      globalThis.ResizeObserver = Original;
    }
  });

  test("it stops observing on unmount", async () => {
    stub(40, 20);
    let disconnected = 0;
    const Original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() { disconnected++; } } as never;
    try {
      const { createRoot } = await import("react-dom/client");
      const { act } = await import("react");
      const root = createRoot(document.createElement("div"));
      await act(async () => root.render(<ExpandableText text={LONG} />));
      await act(async () => root.unmount());
    } finally {
      globalThis.ResizeObserver = Original;
    }
    expect(disconnected).toBe(1);
  });
});
