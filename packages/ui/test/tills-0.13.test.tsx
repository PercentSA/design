// Till and board parts (0.13.0): touch density, Kanban work-board options, ActionBar, ListItem and Card onSelect, Thumbnail fill, Text danger, AppShell fill, Keypad.
import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActionBar,
  AppShell,
  buttonClass,
  Card,
  Kanban,
  Keypad,
  List,
  ListItem,
  NumberInput,
  PercentProvider,
  PinPad,
  SegmentedControl,
  STRINGS,
  Text,
  Thumbnail,
  Toggle,
  DropdownMenu,
  type ActionBarItem,
  type KanbanColumn,
} from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const inLang = (node: ReactNode, lang: "en" | "ar" = "en") => <PercentProvider lang={lang}>{node}</PercentProvider>;
const html = (node: ReactNode, lang: "en" | "ar" = "en") => renderToStaticMarkup(inLang(node, lang));
const dom = (node: ReactNode, lang: "en" | "ar" = "en") => {
  const doc = document.createElement("div");
  doc.innerHTML = html(node, lang);
  return doc;
};
const hasClass = (el: Element, ...names: string[]) => names.every((n) => el.className.split(/\s+/).includes(n));
const byText = (root: ParentNode, selector: string, text: string) => [...root.querySelectorAll<HTMLElement>(selector)].find((b) => b.textContent === text)!;

describe("touch density", () => {
  test("small buttons, toggles, segmented items and number steps follow --p-control-h-xs", async () => {
    expect(buttonClass("primary", "sm")).toContain("h-(--p-control-h-xs)");
    expect(buttonClass("primary", "sm", true)).toContain("size-(--p-control-h-xs)");
    expect(buttonClass("primary", "sm")).not.toContain("h-8");
    const doc = dom(
      <>
        <Toggle aria-label="t">x</Toggle>
        <SegmentedControl aria-label="s" value="a" onValueChange={() => {}} options={[{ value: "a", label: "A" }]} />
        <NumberInput aria-label="n" value={1} onValueChange={() => {}} />
      </>,
    );
    expect(doc.querySelector("button[aria-pressed]")!.className).toContain("h-(--p-control-h-xs)");
    expect(doc.querySelector('[role="radio"]')!.className).toContain("min-w-(--p-control-h-xs)");
    for (const name of ["Decrease", "Increase"]) expect(doc.querySelector(`[aria-label="${name}"]`)!.className).toContain("size-(--p-control-h-xs)");
  });

  test("menu rows have a minimum height from the same token", async () => {
    await mount(inLang(<DropdownMenu open trigger={<button>t</button>} items={[{ label: "One" }]} />));
    expect(document.querySelector('[role="menuitem"]')!.className).toContain("min-h-(--p-control-h-xs)");
  });

  test("AppShell density: compact by default, touch sets the attribute, comfortable none", () => {
    expect(dom(<AppShell header="h">p</AppShell>).firstElementChild!.getAttribute("data-density")).toBe("compact");
    expect(dom(<AppShell header="h" density="touch">p</AppShell>).firstElementChild!.getAttribute("data-density")).toBe("touch");
    expect(dom(<AppShell header="h" density="comfortable">p</AppShell>).firstElementChild!.hasAttribute("data-density")).toBe(false);
  });
});

describe("AppShell fill", () => {
  test("default: min-h-dvh; fill: h-dvh root and a flex column main with min-h-0 (also with a sidebar)", () => {
    const plain = dom(<AppShell header="h">p</AppShell>);
    expect(hasClass(plain.firstElementChild!, "min-h-dvh")).toBe(true);
    expect(plain.querySelector("main")!.className).not.toContain("flex-col");
    const fill = dom(<AppShell fill header="h">p</AppShell>);
    expect(hasClass(fill.firstElementChild!, "h-dvh", "overflow-hidden")).toBe(true);
    expect(fill.firstElementChild!.className).not.toContain("min-h-dvh");
    expect(hasClass(fill.querySelector("main")!, "flex", "min-h-0", "flex-1", "flex-col")).toBe(true);
    const side = dom(<AppShell fill sidebar={<nav>s</nav>}>p</AppShell>);
    expect(side.firstElementChild!.className).toContain("lg:grid-rows-[auto_minmax(0,1fr)]");
    expect(hasClass(side.querySelector("main")!, "lg:row-start-2", "min-h-0")).toBe(true);
  });
});

describe("Text danger", () => {
  test("danger tone uses the danger colour; the others are unchanged", () => {
    expect(hasClass(dom(<Text tone="danger">x</Text>).querySelector("p")!, "text-danger")).toBe(true);
    expect(hasClass(dom(<Text tone="muted">x</Text>).querySelector("p")!, "text-fg-2")).toBe(true);
    expect(hasClass(dom(<Text as="span" tone="danger" size="sm">x</Text>).querySelector("span")!, "text-danger", "text-sm")).toBe(true);
  });
});

describe("ListItem onSelect", () => {
  test("the row is one button; the title is its text; a trailing control still works", async () => {
    const pick = mock(() => {});
    const extra = mock(() => {});
    const el = await mount(
      inLang(
        <List>
          <ListItem title="Front pads" description="BP-01" onSelect={pick} trailing={<button onClick={extra}>Info</button>} />
        </List>,
      ),
    );
    const row = el.querySelector<HTMLButtonElement>("li button[data-stretched]")!;
    expect([row.type, row.textContent, row.className.includes("after:absolute")]).toEqual(["button", "Front pads", true]);
    await click(row);
    expect(pick.mock.calls.length).toBe(1);
    await click(byText(el, "button", "Info"));
    expect([pick.mock.calls.length, extra.mock.calls.length]).toEqual([1, 1]);
    expect(el.querySelector("li")!.className).toContain("hover:bg-surface-2");
  });

  test("disabled: dim, the button is disabled and does not press", async () => {
    const pick = mock(() => {});
    const el = await mount(inLang(<ListItem title="Sold out" onSelect={pick} disabled />));
    const li = el.querySelector("li")!;
    const b = li.querySelector("button")!;
    await click(b);
    expect([b.disabled, pick.mock.calls.length, li.className.includes("opacity-50"), li.className.includes("hover:bg-surface-2")]).toEqual([true, 0, true, false]);
  });

  test("no onSelect: plain text as before; with href, href wins", () => {
    expect(dom(<ListItem title="Plain" />).querySelector("button")).toBeNull();
    const doc = dom(<ListItem title="Link" href="/x" onSelect={() => {}} />);
    expect([doc.querySelector("a")!.getAttribute("href"), doc.querySelector("button")]).toEqual(["/x", null]);
  });
});

describe("Card onSelect, disabled, media", () => {
  test("the whole card is one button named by the title; media shows above the header", async () => {
    const pick = mock(() => {});
    const el = await mount(
      inLang(
        <Card density="compact" media={<Thumbnail src="/p.png" alt="Pads" size="fill" />} title="Brake pad set" description="BP-01" onSelect={pick}>
          <span>Body</span>
        </Card>,
      ),
    );
    const card = el.firstElementChild!;
    const b = card.querySelector<HTMLButtonElement>("button[data-stretched]")!;
    expect([b.textContent, b.title, b.className.includes("line-clamp-2"), b.closest("h3") !== null]).toEqual(["Brake pad set", "Brake pad set", true, true]);
    expect(card.firstElementChild!.querySelector("img")).not.toBeNull();
    expect(card.className).toContain("p-4");
    expect(card.className).toContain("hover:border-fg-3");
    await click(b);
    expect(pick.mock.calls.length).toBe(1);
  });

  test("disabled: dim, no press, no hover border", async () => {
    const pick = mock(() => {});
    const el = await mount(inLang(<Card title="Out of stock" onSelect={pick} disabled />));
    const b = el.querySelector("button")!;
    await click(b);
    expect([b.disabled, pick.mock.calls.length, el.firstElementChild!.className.includes("opacity-50"), el.firstElementChild!.className.includes("hover:border-fg-3")]).toEqual([true, 0, true, false]);
  });

  test("href still makes a link; a card without onSelect has no button; RTL renders", () => {
    expect(dom(<Card title="T" href="/a" />).querySelector("a")).not.toBeNull();
    expect(dom(<Card title="T">x</Card>).querySelector("button")).toBeNull();
    expect(html(<Card title="عنوان" onSelect={() => {}} />, "ar")).toContain("عنوان");
  });
});

describe("Thumbnail fill", () => {
  test("full width, 4:3, fallback icon when there is no image", () => {
    const doc = dom(<Thumbnail alt="x" size="fill" />);
    expect(hasClass(doc.firstElementChild!, "grid", "w-full")).toBe(true);
    expect(hasClass(doc.firstElementChild!.firstElementChild!, "aspect-4/3", "w-full")).toBe(true);
    expect(doc.querySelector('[role="img"]')).not.toBeNull();
    // The fixed sizes are unchanged.
    expect(hasClass(dom(<Thumbnail alt="x" />).firstElementChild!.firstElementChild!, "size-16")).toBe(true);
  });
});

type Card_ = { id: string; name: string };
const cards = (n: number): Card_[] => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, name: `Order ${i + 1}` }));
function Lanes({ columns, ...props }: { columns: KanbanColumn<Card_>[] } & Partial<Parameters<typeof Kanban<Card_>>[0]>) {
  return (
    <Kanban<Card_>
      columns={columns}
      getCardId={(c) => c.id}
      getCardLabel={(c) => c.name}
      renderCard={(c) => (
        <div>
          <a href={`/o/${c.id}`}>{c.name}</a>
          <button>Prepare</button>
        </div>
      )}
      {...props}
    />
  );
}
const section = (root: ParentNode, id: string) => root.querySelector<HTMLElement>(`[data-column="${id}"]`)!;

describe("Kanban work board", () => {
  test("without onMove: no drag, no Move menu, the card actions stay content", async () => {
    const el = await mount(inLang(<Lanes columns={[{ id: "paid", title: "Paid", cards: cards(2) }]} />));
    expect(el.querySelector('[data-move], [aria-label^="Move"]')).toBeNull();
    const li = el.querySelector("li[data-card-id]")!;
    expect([li.getAttribute("draggable"), li.className.includes("cursor-grab")]).toEqual(["false", false]);
    expect(li.querySelectorAll("a, button").length).toBe(2);
  });

  test("with onMove nothing changes: draggable cards and a Move button", () => {
    const doc = dom(<Lanes columns={[{ id: "a", title: "A", cards: cards(1) }]} onMove={() => {}} />);
    expect(doc.querySelector("li[data-card-id]")!.getAttribute("draggable")).toBe("true");
    expect(doc.querySelector('[aria-label="Move Order 1"]')).not.toBeNull();
  });

  test("count: the server total, cards.length by default, an ellipsis while not known", () => {
    const doc = dom(
      <Lanes
        columns={[
          { id: "a", title: "Paid", cards: cards(2), count: 12 },
          { id: "b", title: "Ready", cards: cards(3) },
          { id: "c", title: "Done", cards: [], count: null },
        ]}
      />,
    );
    const counts = ["a", "b", "c"].map((id) => section(doc, id).querySelector("h3 span")!.textContent);
    expect(counts).toEqual(["12", "3", "…"]);
    expect(section(doc, "a").querySelector("h3 span")!.className).toContain("tabular-nums");
  });

  test("loading: two skeleton cards on the first read, busy and named for screen readers; loaded cards stay on a later read", () => {
    const doc = dom(<Lanes columns={[{ id: "a", title: "Paid", cards: [], count: null, state: "loading" }, { id: "b", title: "Ready", cards: cards(1), state: "loading" }]} />);
    const a = section(doc, "a");
    expect([a.getAttribute("aria-busy"), a.querySelectorAll(".animate-pulse").length, a.textContent]).toEqual(["true", 2, "Paid…Loading"]);
    expect([section(doc, "b").querySelectorAll(".animate-pulse").length, section(doc, "b").querySelectorAll("[data-card-id]").length]).toEqual([0, 1]);
  });

  test("error without cards: an alert with Try again; with cards: cards stay and the error line comes after them", async () => {
    const retry = mock(() => {});
    const el = await mount(
      inLang(
        <Lanes
          columns={[
            { id: "a", title: "Paid", cards: [], state: "error", onRetry: retry },
            { id: "b", title: "Ready", cards: cards(2), state: "error", onRetry: retry },
          ]}
        />,
      ),
    );
    const a = section(el, "a");
    expect(a.querySelector('[role="alert"]')!.textContent).toContain("Could not load this column.");
    await click(byText(a, "button", "Try again"));
    const b = section(el, "b");
    expect(b.querySelectorAll("[data-card-id]").length).toBe(2);
    const last = b.querySelector("ul")!.lastElementChild!;
    expect([last.getAttribute("role"), last.textContent]).toEqual(["alert", "Could not load this column.Try again"]);
    await click(byText(b, "button", "Try again"));
    expect(retry.mock.calls.length).toBe(2);
  });

  test("empty: the default text, or the column's own; not while loading", () => {
    const doc = dom(<Lanes columns={[{ id: "a", title: "A", cards: [] }, { id: "b", title: "B", cards: [], empty: "No orders" }, { id: "c", title: "C", cards: [], state: "loading" }]} />);
    expect(section(doc, "a").querySelector("ul")!.textContent).toBe("No items");
    expect(section(doc, "b").querySelector("ul")!.textContent).toBe("No orders");
    expect(section(doc, "c").querySelector("ul")!.textContent).not.toContain("No items");
  });

  test("load more: the button calls onLoadMore, shows loading while loadingMore", async () => {
    const more = mock(() => {});
    const el = await mount(inLang(<Lanes columns={[{ id: "a", title: "Paid", cards: cards(2), hasMore: true, onLoadMore: more }]} />));
    await click(byText(el, "button", "Load more"));
    expect(more.mock.calls.length).toBe(1);
    const loading = await mount(inLang(<Lanes columns={[{ id: "a", title: "Paid", cards: cards(2), hasMore: true, loadingMore: true, onLoadMore: more }]} />));
    expect(loading.querySelector('button[aria-busy="true"]')).not.toBeNull();
    await click(loading.querySelector('button[aria-busy="true"]')!);
    expect(more.mock.calls.length).toBe(1);
    expect(dom(<Lanes columns={[{ id: "a", title: "Paid", cards: cards(2) }]} />).textContent).not.toContain("Load more");
  });

  test("the next page loads by itself once when the end scrolls into view, and again for the next page only", async () => {
    const observers: { cb: IntersectionObserverCallback; el: Element }[] = [];
    const Original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(public cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        observers.push({ cb: this.cb, el });
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    try {
      const more = mock(() => {});
      const Wrapper = ({ n, loading }: { n: number; loading?: boolean }) => (
        <Lanes columns={[{ id: "a", title: "Paid", cards: cards(n), hasMore: true, loadingMore: loading, onLoadMore: more }]} />
      );
      const el = document.createElement("div");
      document.body.append(el);
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(el);
      const show = (node: ReactNode) => act(async () => root.render(inLang(node)));
      const hit = () =>
        act(async () => {
          const o = observers.at(-1)!;
          o.cb([{ isIntersecting: true, target: o.el } as IntersectionObserverEntry], {} as IntersectionObserver);
        });
      await show(<Wrapper n={2} />);
      await hit();
      await hit();
      expect(more.mock.calls.length).toBe(1);
      // While loading, no new call; a new page of cards allows the next one.
      await show(<Wrapper n={2} loading />);
      await hit();
      expect(more.mock.calls.length).toBe(1);
      await show(<Wrapper n={4} />);
      await hit();
      expect(more.mock.calls.length).toBe(2);
      await act(async () => root.unmount());
    } finally {
      globalThis.IntersectionObserver = Original;
    }
  });

  test("fill, columnWidth fill and density compact", () => {
    const cols = [{ id: "a", title: "A", cards: cards(1) }];
    const doc = dom(<Lanes columns={cols} fill columnWidth="fill" density="compact" className="mine" />);
    const wrap = doc.firstElementChild!;
    expect(hasClass(wrap, "h-full", "min-h-0", "mine")).toBe(true);
    const col = section(doc, "a");
    expect(hasClass(col, "md:min-w-56", "md:flex-1", "min-h-0")).toBe(true);
    expect(col.querySelector("ul")!.className).toContain("overflow-y-auto");
    expect(col.querySelector("li")!.className).toContain("p-2.5");
    // The default board keeps its markup: no wrapper, 18rem columns, p-3 cards.
    const plain = dom(<Lanes columns={cols} className="mine" />);
    expect(hasClass(plain.firstElementChild!, "mine", "overflow-x-auto")).toBe(true);
    expect(hasClass(section(plain, "a"), "sm:w-72")).toBe(true);
    expect(plain.querySelector("li")!.className).toContain("p-3");
  });

  test('phone="switch": a switch with title and count, only the shown column on a phone, controlled by column', async () => {
    const change = mock((_: string) => {});
    const cols = [
      { id: "paid", title: "Paid", cards: cards(1), count: 12 },
      { id: "ready", title: "Ready", cards: cards(1), count: 3 },
    ];
    const el = await mount(inLang(<Lanes columns={cols} phone="switch" column="ready" onColumnChange={change} />));
    const nav = el.querySelector("nav")!;
    expect(nav.getAttribute("aria-label")).toBe("Columns");
    expect(nav.className).toContain("md:hidden");
    expect(nav.className).toContain("overflow-x-auto");
    const buttons = [...nav.querySelectorAll("button")];
    expect(buttons.map((b) => [b.textContent, b.getAttribute("aria-pressed")])).toEqual([["Paid(12)", "false"], ["Ready(3)", "true"]]);
    expect(section(el, "paid").className).toContain("max-md:hidden");
    expect(section(el, "ready").className).not.toContain("max-md:hidden");
    await click(buttons[0]!);
    expect(change.mock.calls).toEqual([["paid"]]);
    // Controlled: the shown column stays until the app changes `column`.
    expect(nav.querySelectorAll('[aria-pressed="true"]')[0]!.textContent).toBe("Ready(3)");
  });

  test('phone="switch" uncontrolled shows the first column and follows the switch', async () => {
    const el = await mount(inLang(<Lanes columns={[{ id: "a", title: "A", cards: [] }, { id: "b", title: "B", cards: [] }]} phone="switch" />));
    expect(section(el, "b").className).toContain("max-md:hidden");
    await click(byText(el, "nav button", "B(0)"));
    expect([section(el, "a").className.includes("max-md:hidden"), section(el, "b").className.includes("max-md:hidden")]).toEqual([true, false]);
  });

  test("Arabic: words in Arabic, the board follows the reading direction (no fixed left/right classes)", () => {
    const doc = dom(<Lanes columns={[{ id: "a", title: "مدفوع", cards: [], count: 12 }, { id: "b", title: "جاهز", cards: [], state: "error" }]} phone="switch" />, "ar");
    expect(section(doc, "a").textContent).toContain("لا توجد عناصر");
    expect(section(doc, "b").textContent).toContain("تعذّر تحميل هذا العمود.");
    expect(doc.querySelector("nav")!.getAttribute("aria-label")).toBe(STRINGS.ar.columns);
    expect(doc.innerHTML).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/);
    expect(STRINGS.ar.loadMore).toBe("تحميل المزيد");
  });
});

const items = (extra: Partial<ActionBarItem> = {}): ActionBarItem[] => [
  { id: "help", label: "Help", icon: <i>?</i>, keyHint: "F1", onSelect: () => {} },
  { id: "orders", label: "Orders", icon: <i>o</i>, keyHint: "F2", onSelect: () => {} },
  { id: "close", label: "Close shift", icon: <i>x</i>, tone: "danger", group: "end", onSelect: () => {}, ...extra },
];

describe("ActionBar", () => {
  test("a nav with the label, equal tiles with icon, label and key hint; the hint is a ltr Kbd hidden on a coarse pointer", () => {
    const doc = dom(<ActionBar label="Till actions" items={items()} />);
    const nav = doc.querySelector("nav")!;
    expect(nav.getAttribute("aria-label")).toBe("Till actions");
    const tiles = [...nav.querySelectorAll("button")];
    expect(tiles.map((t) => t.textContent)).toEqual(["?HelpF1", "oOrdersF2", "xClose shift"]);
    expect(tiles.every((t) => hasClass(t, "flex-1", "basis-0", "h-14", "rounded-field", "border-line") || t.className.includes("border-danger"))).toBe(true);
    expect(tiles[0]!.className).toContain("in-data-[density=touch]:h-16");
    const kbd = tiles[0]!.querySelector("kbd")!;
    expect([kbd.getAttribute("dir"), kbd.className.includes("pointer-coarse:hidden")]).toEqual(["ltr", true]);
    expect(tiles[0]!.title).toBe("Help");
  });

  test("a danger item after a separator; disabled keeps its place", async () => {
    const onSelect = mock(() => {});
    const el = await mount(inLang(<ActionBar label="Actions" items={items({ onSelect, disabled: true })} />));
    const nav = el.querySelector("nav")!;
    const kids = [...nav.children];
    expect(kids.map((k) => k.tagName)).toEqual(["BUTTON", "BUTTON", "SPAN", "BUTTON"]);
    expect(kids[2]!.getAttribute("aria-hidden")).toBe("true");
    const close = kids[3] as HTMLButtonElement;
    expect([close.disabled, hasClass(close, "text-danger", "border-danger")]).toEqual([true, true]);
    await click(close);
    expect(onSelect.mock.calls.length).toBe(0);
    const help = kids[0] as HTMLButtonElement;
    await click(help);
  });

  test("tiles call onSelect; Tab order follows the DOM (no arrow-key roving)", async () => {
    const onSelect = mock(() => {});
    const el = await mount(inLang(<ActionBar label="A" items={[{ id: "a", label: "A", icon: null, onSelect }]} />));
    await click(el.querySelector("button")!);
    expect(onSelect.mock.calls.length).toBe(1);
    expect(el.querySelector("button")!.tabIndex).toBe(0);
  });

  test("no items: nothing renders", () => {
    expect(html(<ActionBar label="A" items={[]} />)).toBe("");
  });

  test("a long label is cut with the full text in title", () => {
    const doc = dom(<ActionBar label="A" items={[{ id: "a", label: "A very long action label", icon: null, onSelect: () => {} }]} />);
    const b = doc.querySelector("button")!;
    expect([b.title, b.querySelector("span")!.className.includes("truncate")]).toEqual(["A very long action label", true]);
  });

  test("overflow: when a tile would be narrower than 5rem the last main items go into a More menu; end items stay", async () => {
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    // 3 tiles of 5rem and 2 gaps of 0.5rem (16 px per rem) = 264 px: room for 3 tiles.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 264 });
    try {
      const many: ActionBarItem[] = [
        ...["a", "b", "c", "d"].map((id, i) => ({ id, label: id.toUpperCase(), icon: null, keyHint: `F${i + 1}`, onSelect: () => {} })),
        { id: "close", label: "Close", icon: null, group: "end" as const, tone: "danger" as const, onSelect: () => {} },
      ];
      const el = await mount(inLang(<ActionBar label="Actions" items={many} />));
      const nav = el.querySelector("nav")!;
      const names = [...nav.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent?.replace(/F\d/, ""));
      // 3 tiles: A, More, Close.
      expect(names).toEqual(["A", "More actions", "Close"]);
      await act(async () => {
        nav.querySelector('[aria-label="More actions"]')!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" } as PointerEventInit));
      });
      const rows = [...document.querySelectorAll('[role="menuitem"]')];
      expect(rows.map((r) => r.textContent)).toEqual(["BF2", "CF3", "DF4"]);
    } finally {
      if (width) Object.defineProperty(HTMLElement.prototype, "clientWidth", width);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    }
  });

  test("Arabic: the More label and menu are in Arabic; the bar uses logical order (no left/right classes)", () => {
    expect(STRINGS.ar.more).toBe("المزيد");
    expect(STRINGS.en.more).toBe("More");
    const doc = dom(<ActionBar label="إجراءات الصندوق" items={items()} />, "ar");
    expect(doc.querySelector("nav")!.getAttribute("aria-label")).toBe("إجراءات الصندوق");
    expect(doc.innerHTML).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/);
  });
});

describe("Keypad", () => {
  function Amount(props: Partial<Parameters<typeof Keypad>[0]> & { start?: string; log?: string[] }) {
    const [v, set] = useState(props.start ?? "");
    const { start: _s, log, ...rest } = props;
    return (
      <>
        <output data-draft>{v}</output>
        <Keypad label="Amount keypad" value={v} onValueChange={(d) => (log?.push(d), set(d))} {...rest} />
      </>
    );
  }
  const draft = (root: ParentNode) => root.querySelector("[data-draft]")!.textContent;
  const keys = (root: ParentNode) => [...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
  const tap = async (root: ParentNode, ...labels: string[]) => {
    for (const l of labels) await click(keys(root).find((b) => (b.getAttribute("aria-label") ?? b.textContent) === l)!);
  };
  const keydown = (init: KeyboardEventInit, target: EventTarget = document.body) =>
    act(async () => {
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
    });

  test("a named group of buttons: 1 to 9, then point, 0, 00, and backspace; left to right in both languages", async () => {
    for (const lang of ["en", "ar"] as const) {
      const el = await mount(inLang(<Amount />, lang));
      const group = el.querySelector('[role="group"]')!;
      expect(group.getAttribute("aria-label")).toBe("Amount keypad");
      expect(keys(el).map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual([
        ..."123456789".split(""),
        STRINGS[lang].keypad.point,
        "0",
        STRINGS[lang].keypad.doubleZero,
        STRINGS[lang].keypad.backspace,
      ]);
      expect(keys(el).every((b) => b.type === "button" && b.className.includes("h-14") && b.className.includes("border-line-strong"))).toBe(true);
      expect(el.querySelector(".grid-cols-3")!.getAttribute("dir")).toBe("ltr");
    }
  });

  test("typing builds the draft; a leading zero is replaced; '0' on '0' does nothing; 00 on an empty draft gives one zero", async () => {
    const el = await mount(inLang(<Amount />));
    await tap(el, "1", "2", "5");
    expect(draft(el)).toBe("125");
    await tap(el, "Delete last digit", "Delete last digit", "Delete last digit", "Delete last digit");
    expect(draft(el)).toBe("");
    await tap(el, "00, double zero");
    expect(draft(el)).toBe("0");
    await tap(el, "0", "7");
    expect(draft(el)).toBe("7");
    await tap(el, "00, double zero");
    expect(draft(el)).toBe("700");
  });

  test("the point: once, '0.' on an empty draft; a third decimal is refused (default 2); 00 stops at the room left", async () => {
    const el = await mount(inLang(<Amount />));
    await tap(el, "Decimal point");
    expect(draft(el)).toBe("0.");
    await tap(el, "Decimal point", "2", "5", "9");
    expect(draft(el)).toBe("0.25");
    await tap(el, "Delete last digit", "Delete last digit", "00, double zero");
    expect(draft(el)).toBe("0.00");
    await tap(el, "Delete last digit", "Delete last digit", "Delete last digit", "Delete last digit", "Delete last digit");
    expect(draft(el)).toBe("");
    await tap(el, "1", "Decimal point", "00, double zero", "00, double zero");
    expect(draft(el)).toBe("1.00");
  });

  test("decimals={0}: no point key and no fraction; decimals={3} allows three", async () => {
    const el = await mount(inLang(<Amount decimals={0} />));
    expect(keys(el).some((b) => b.getAttribute("aria-label") === "Decimal point")).toBe(false);
    expect(keys(el).length).toBe(12);
    const el3 = await mount(inLang(<Amount decimals={3} />));
    await tap(el3, "1", "Decimal point", "2", "3", "4", "5");
    expect(draft(el3)).toBe("1.234");
  });

  test("maxLength: the digit keys refuse at the limit; backspace still works", async () => {
    const log: string[] = [];
    const el = await mount(inLang(<Amount maxLength={4} log={log} />));
    await tap(el, "1", "2", "3", "4", "5", "Decimal point", "00, double zero");
    expect(draft(el)).toBe("1234");
    expect(log).toEqual(["1", "12", "123", "1234"]);
    await tap(el, "Delete last digit");
    expect(draft(el)).toBe("123");
  });

  test("pin mode: 1 to 9, 0 and backspace; no point and no 00", async () => {
    const el = await mount(inLang(<Amount mode="pin" maxLength={4} label="PIN" />));
    expect(keys(el).map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual([..."123456789".split(""), "0", "Delete last digit"]);
    await tap(el, "0", "0", "1", "2", "3");
    expect(draft(el)).toBe("0012");
    await keydown({ key: "." });
    expect(draft(el)).toBe("0012");
  });

  test("disabled: the keys are disabled and the hardware keyboard does nothing", async () => {
    const el = await mount(inLang(<Amount disabled />));
    expect(keys(el).every((b) => b.disabled)).toBe(true);
    await keydown({ key: "5" });
    expect(draft(el)).toBe("");
  });

  test("two taps in the same frame both count", async () => {
    const el = await mount(inLang(<Amount />));
    await act(async () => {
      keys(el)[0]!.click();
      keys(el)[1]!.click();
    });
    expect(draft(el)).toBe("12");
  });

  test("hardware keyboard: digits (also Arabic digits), the point and Backspace work when the focus is on the page; the key is taken only when it did something", async () => {
    const el = await mount(inLang(<Amount />));
    await keydown({ key: "4" });
    await keydown({ key: "٢" });
    await keydown({ key: "." });
    await keydown({ key: "5" });
    expect(draft(el)).toBe("42.5");
    const taken = async (init: KeyboardEventInit) => {
      const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      await act(async () => {
        document.body.dispatchEvent(e);
      });
      return e.defaultPrevented;
    };
    expect(await taken({ key: "6" })).toBe(true);
    expect(await taken({ key: "7" })).toBe(false);
    expect(await taken({ key: "a" })).toBe(false);
    expect(await taken({ key: "." })).toBe(false);
    expect(await taken({ key: "Backspace" })).toBe(true);
    expect(draft(el)).toBe("42.5");
  });

  test("hardware keyboard: not for a text field, a dialog or menu, a repeat or a shortcut; yes inside the keypad", async () => {
    const el = await mount(
      inLang(
        <>
          <Amount />
          <input data-testid="field" />
          <div role="dialog">
            <button data-testid="in-dialog">ok</button>
          </div>
        </>,
      ),
    );
    const field = el.querySelector("input")!;
    field.focus();
    await keydown({ key: "1" }, field);
    expect(draft(el)).toBe("");
    const inDialog = el.querySelector<HTMLElement>('[data-testid="in-dialog"]')!;
    inDialog.focus();
    await keydown({ key: "1" }, inDialog);
    expect(draft(el)).toBe("");
    (document.activeElement as HTMLElement).blur();
    await keydown({ key: "1", repeat: true });
    await keydown({ key: "1", ctrlKey: true });
    await keydown({ key: "1", metaKey: true });
    await keydown({ key: "1", altKey: true });
    expect(draft(el)).toBe("");
    const key = keys(el)[1]!;
    key.focus();
    await keydown({ key: "3" }, key);
    expect(draft(el)).toBe("3");
    // Another handler took the key first.
    document.body.focus();
    const e = new KeyboardEvent("keydown", { key: "4", bubbles: true, cancelable: true });
    e.preventDefault();
    document.body.dispatchEvent(e);
    expect(draft(el)).toBe("3");
  });

  test("the strings exist in both languages", () => {
    expect(STRINGS.en.keypad).toEqual({ backspace: "Delete last digit", point: "Decimal point", doubleZero: "00, double zero" });
    expect(Object.keys(STRINGS.ar.keypad).sort()).toEqual(Object.keys(STRINGS.en.keypad).sort());
    expect(Object.values(STRINGS.ar.keypad).every((v) => /[؀-ۿ]/.test(v))).toBe(true);
  });
});

describe("review fixes", () => {
  const keydown = (init: KeyboardEventInit, target: EventTarget = document.body) =>
    act(async () => {
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
    });

  test("two keypads on one page: with the focus on the page only the first acts, even when it refuses the key", async () => {
    function Two() {
      const [a, setA] = useState("");
      const [b, setB] = useState("");
      return (
        <>
          <output data-a>{a}</output>
          <output data-b>{b}</output>
          <Keypad label="A" mode="pin" maxLength={1} value={a} onValueChange={setA} />
          <Keypad label="B" mode="pin" maxLength={4} value={b} onValueChange={setB} />
        </>
      );
    }
    const el = await mount(inLang(<Two />));
    const a = () => el.querySelector("[data-a]")!.textContent;
    const b = () => el.querySelector("[data-b]")!.textContent;
    // Backspace on an empty first pad is refused: the second pad must not see it either.
    await keydown({ key: "Backspace" });
    await keydown({ key: "7" });
    expect([a(), b()]).toEqual(["7", ""]);
    // At maxLength the first pad refuses a digit; the second stays unchanged.
    await keydown({ key: "8" });
    expect([a(), b()]).toEqual(["7", ""]);
    // Focus inside the second pad: it acts, the first does not.
    const key = el.querySelectorAll<HTMLElement>('[role="group"]')[1]!.querySelector("button")!;
    key.focus();
    await keydown({ key: "3" }, key);
    expect([a(), b()]).toEqual(["7", "3"]);
  });

  test('a comma is not a decimal point ("1,250" gives no point); "." and the Arabic point are', async () => {
    function One() {
      const [v, set] = useState("");
      return (
        <>
          <output data-d>{v}</output>
          <Keypad label="A" value={v} onValueChange={set} />
        </>
      );
    }
    const el = await mount(inLang(<One />));
    for (const k of ["1", ",", "2", "5", "0"]) await keydown({ key: k });
    expect(el.querySelector("[data-d]")!.textContent).toBe("1250");
    await keydown({ key: "٫" });
    expect(el.querySelector("[data-d]")!.textContent).toBe("1250.");
  });

  test('the "00" key keeps its digits in its name, in both languages', () => {
    expect(STRINGS.en.keypad.doubleZero).toContain("00");
    expect(STRINGS.ar.keypad.doubleZero).toContain("00");
  });

  test("Kanban without onMove attaches no drag handlers; with onMove it does", async () => {
    const cols = [{ id: "a", title: "A", cards: cards(1) }];
    const plain = await mount(inLang(<Lanes columns={cols} />));
    const dragged = new Event("dragstart", { bubbles: true, cancelable: true });
    Object.assign(dragged, { dataTransfer: { setData() {}, effectAllowed: "" } });
    await act(async () => {
      plain.querySelector("li[data-card-id] a")!.dispatchEvent(dragged);
    });
    expect(plain.querySelector("li[data-card-id]")!.className).not.toContain("opacity-50");
    const moving = await mount(inLang(<Lanes columns={cols} onMove={() => {}} />));
    const d2 = new Event("dragstart", { bubbles: true, cancelable: true });
    Object.assign(d2, { dataTransfer: { setData() {}, effectAllowed: "" } });
    await act(async () => {
      moving.querySelector("li[data-card-id]")!.dispatchEvent(d2);
    });
    expect(moving.querySelector("li[data-card-id]")!.className).toContain("opacity-50");
  });

  test("the phone switch scrolls only its own row, never the page (no scrollIntoView)", async () => {
    const original = HTMLElement.prototype.scrollIntoView;
    const spy = mock(() => {});
    HTMLElement.prototype.scrollIntoView = spy;
    try {
      const cols = [
        { id: "a", title: "A", cards: [] },
        { id: "b", title: "B", cards: [] },
      ];
      const el = await mount(inLang(<Lanes columns={cols} phone="switch" />));
      await click(byText(el, "nav button", "B(0)"));
      expect(spy.mock.calls.length).toBe(0);
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  test("a disabled ActionBar tile keeps pointer events, so its title tooltip can show", () => {
    const doc = dom(<ActionBar label="A" items={[{ id: "a", label: "History", icon: null, disabled: true, onSelect: () => {} }]} />);
    const b = doc.querySelector("button")!;
    expect([b.disabled, b.title, b.className.includes("pointer-events-none")]).toEqual([true, "History", false]);
  });
});

describe("ActionBar height", () => {
  const h = (doc: ParentNode) => [...doc.querySelectorAll("nav button")].map((b) => b.className);
  test("with a key hint on any item every tile is 4.5rem on a fine pointer; without, 56 px; the touch 64 px rule stays", () => {
    const withKeys = h(dom(<ActionBar label="A" items={[{ id: "a", label: "A", icon: null, keyHint: "F1", onSelect: () => {} }, { id: "b", label: "B", icon: null, onSelect: () => {} }]} />));
    expect(withKeys.every((c) => hasClass({ className: c } as Element, "pointer-fine:h-18", "pointer-fine:justify-evenly", "h-14", "in-data-[density=touch]:h-16"))).toBe(true);
    expect(withKeys.every((c) => c.includes("pointer-fine:in-data-[density=touch]:h-18"))).toBe(true);
    const without = h(dom(<ActionBar label="A" items={[{ id: "a", label: "A", icon: null, onSelect: () => {} }]} />));
    expect(without[0]).toContain("h-14");
    expect(without[0]).toContain("in-data-[density=touch]:h-16");
    expect(without[0]).not.toContain("h-18");
  });
});

describe("PinPad shares the key grid with Keypad", () => {
  afterEach(() => {});
  test("same grid markup: 3 columns, left to right, 56 px keys; its API is unchanged", async () => {
    const pin = await mount(inLang(<PinPad label="Code" onComplete={() => {}} />));
    const pad = await mount(inLang(<Keypad label="PIN" mode="pin" value="" onValueChange={() => {}} />));
    const grid = (el: ParentNode) => el.querySelector(".grid-cols-3")!;
    expect(grid(pin).className).toBe(grid(pad).className);
    expect(grid(pin).getAttribute("dir")).toBe("ltr");
    expect([...grid(pin).children].map((c) => c.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "Clear"]);
    expect(press).toBeDefined();
  });
});
