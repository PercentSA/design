import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { act, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, DescriptionList, LineItemsTable, Money, PercentProvider, RecordSection, RecordSummary, Thumbnail, type LineItem } from "../src";
import { mount, useDom } from "./dom";

useDom();

// happy-dom reports every image as complete; a browser says so only after the load or the error.
const complete = (value: boolean, naturalWidth = 0) => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => value });
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { configurable: true, get: () => naturalWidth });
  Object.defineProperty(HTMLImageElement.prototype, "currentSrc", { configurable: true, get() { return this.getAttribute("src") ?? ""; } });
};
beforeEach(() => complete(false));

const RouterLink = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
const wrap = (lang: "en" | "ar", node: ReactNode) => (
  <PercentProvider lang={lang} link={RouterLink}>
    {node}
  </PercentProvider>
);
const render = (lang: "en" | "ar", node: ReactNode) => mount(wrap(lang, node));
const html = (lang: "en" | "ar", node: ReactNode) => renderToStaticMarkup(wrap(lang, node));

describe("Thumbnail", () => {
  test("an image with its alt, in the size square", async () => {
    for (const [size, cls] of [["sm", "size-10"], ["md", "size-16"], ["lg", "size-24"]] as const) {
      const el = await render("en", <Thumbnail src="/a.png" alt="Brake pad" size={size} />);
      const img = el.querySelector("img")!;
      expect([img.getAttribute("src"), img.getAttribute("alt")]).toEqual(["/a.png", "Brake pad"]);
      expect(el.querySelector("span.border")!.className).toContain(cls);
    }
    // md is the default; the box uses the tokens, not colours.
    const box = (await render("en", <Thumbnail src="/a.png" alt="x" />)).querySelector("span.border")!;
    expect(box.className).toContain("size-16");
    expect(box.className).toMatch(/rounded-field.*border-line.*bg-surface-2/);
  });

  test("no src shows the icon, named by alt", async () => {
    for (const src of [undefined, null, ""]) {
      const el = await render("en", <Thumbnail src={src} alt="Brake pad set" />);
      expect(el.querySelector("img")).toBeNull();
      const icon = el.querySelector('[role="img"]')!;
      expect(icon.getAttribute("aria-label")).toBe("Brake pad set");
      expect(icon.querySelector("svg")).not.toBeNull();
    }
  });

  test("a load error shows the icon", async () => {
    const el = await render("en", <Thumbnail src="/gone.png" alt="Gone" />);
    await act(async () => el.querySelector("img")!.dispatchEvent(new Event("error")));
    expect(el.querySelector("img")).toBeNull();
    expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe("Gone");
    const again = await render("en", <Thumbnail src="/gone.png" alt="Gone" />);
    expect(again.querySelector("img")).not.toBeNull();
  });

  test("an image that failed before hydration (complete, empty) shows the icon", async () => {
    complete(true, 0);
    const el = await render("en", <Thumbnail src="/gone.png" alt="Gone" />);
    expect(el.querySelector("img")).toBeNull();
    expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe("Gone");
    complete(true, 40);
    expect((await render("en", <Thumbnail src="/ok.png" alt="Ok" />)).querySelector("img")).not.toBeNull();
  });

  test("a custom fallback replaces the icon", async () => {
    const el = await render("ar", <Thumbnail alt="فاتورة-المورد.pdf" fallback={<svg data-custom="" />} />);
    expect(el.querySelector("[data-custom]")).not.toBeNull();
  });

  test("a caption is one line, cut, with the full text in title", async () => {
    const el = await render("en", <Thumbnail alt="x" caption="supplier-invoice-with-a-very-long-name.pdf" size="md" />);
    const caption = el.querySelector("[title]")!;
    expect(caption.className).toContain("truncate");
    expect(caption.className).toContain("w-16");
    expect(caption.getAttribute("title")).toBe("supplier-invoice-with-a-very-long-name.pdf");
  });

  test("href makes the whole thumbnail one link, with the router link", async () => {
    const el = await render("ar", <Thumbnail alt="فاتورة" caption="فاتورة" href="/files/1" />);
    const a = el.querySelector("a")!;
    expect([a.getAttribute("href"), a.hasAttribute("data-router")]).toEqual(["/files/1", true]);
    expect(a.querySelector('[role="img"]')).not.toBeNull();
    expect(a.textContent).toBe("فاتورة");
    expect(a.className).toContain("focus-visible:outline-2");
    expect((await render("en", <Thumbnail alt="x" />)).querySelector("a")).toBeNull();
  });

  test("nothing mirrors in Arabic: logical or no direction classes only", () => {
    const out = html("ar", <Thumbnail src="/a.png" alt="x" caption="y" href="/z" />);
    expect(out).not.toMatch(/\b(ml|mr|pl|pr|left|right)-/);
    expect(out).not.toContain("rtl:");
  });
});

const ITEMS = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, label: `Label ${i}`, value: `Value ${i}` }));
const grid = (el: Element) => el.querySelector("dl")!.className;

describe("RecordSummary", () => {
  test("a group named Summary / ملخص, one dt and dd per item, the label first", async () => {
    const en = await render("en", <RecordSummary items={ITEMS(3)} />);
    const group = en.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).toBe("Summary");
    expect([...en.querySelectorAll("dl > div")].map((c) => [c.children[0]!.tagName, c.children[1]!.tagName])).toEqual([["DT", "DD"], ["DT", "DD"], ["DT", "DD"]]);
    expect([...en.querySelectorAll("dt")].map((x) => x.textContent)).toEqual(["Label 0", "Label 1", "Label 2"]);
    expect((await render("ar", <RecordSummary items={ITEMS(2)} />)).querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("ملخص");
    expect((await render("en", <RecordSummary items={ITEMS(2)} label="Order facts" />)).querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("Order facts");
  });

  test("the cells per row follow the strip's own width (container query classes)", async () => {
    const six = await render("en", <RecordSummary items={ITEMS(6)} />);
    expect(six.querySelector('[role="group"]')!.className).toContain("@container");
    for (const c of ["grid-cols-2", "@xl:grid-cols-3", "@4xl:grid-cols-6"]) expect(grid(six)).toContain(c);
    // 4 or fewer: all in one row from 36rem.
    const four = await render("en", <RecordSummary items={ITEMS(4)} />);
    for (const c of ["grid-cols-2", "@xl:grid-cols-4", "@4xl:grid-cols-4"]) expect(grid(four)).toContain(c);
    const one = await render("en", <RecordSummary items={ITEMS(1)} />);
    for (const c of ["grid-cols-1", "@xl:grid-cols-1", "@4xl:grid-cols-1"]) expect(grid(one)).toContain(c);
    // No viewport breakpoints.
    expect(grid(six)).not.toMatch(/(^| )(sm|md|lg|xl):/);
  });

  test("media sits first: above the cells below 36rem, at the start (border-e) from 36rem", async () => {
    const el = await render("ar", <RecordSummary items={ITEMS(3)} media={<Thumbnail alt="x" size="lg" />} />);
    const strip = el.querySelector('[role="group"]')!;
    expect(strip.className).toContain("flex-col");
    expect(strip.className).toContain("@xl:flex-row");
    const media = strip.children[0]!;
    expect(media.querySelector('[role="img"]')).not.toBeNull();
    expect(media.className).toContain("@xl:border-e");
    expect(strip.children[1]!.tagName).toBe("DL");
    expect((await render("en", <RecordSummary items={ITEMS(3)} />)).querySelector('[role="group"]')!.children.length).toBe(1);
  });

  test("an empty value shows the Not set word in both languages, subtle", async () => {
    const items = [{ id: "a", label: "A", value: null }, { id: "b", label: "B", value: "" }, { id: "c", label: "C", value: 0 }];
    const en = await render("en", <RecordSummary items={items} />);
    const dds = [...en.querySelectorAll("dd")].map((d) => d.textContent);
    expect(dds).toEqual(["Not set", "Not set", "0"]);
    expect(en.querySelector("dd span")!.className).toContain("text-fg-3");
    expect([...(await render("ar", <RecordSummary items={items} />)).querySelectorAll("dd")].map((d) => d.textContent)).toEqual(["غير محدد", "غير محدد", "0"]);
  });

  test("loading shows a skeleton per cell, keeps the labels, and says Loading", async () => {
    const el = await render("ar", <RecordSummary items={[...ITEMS(3), { id: "h", label: "H", value: "v", hint: "hint" }]} loading />);
    expect(el.querySelector('[role="group"]')!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelectorAll("dd [aria-hidden]").length).toBe(4);
    expect(el.textContent).not.toContain("Value 0");
    expect(el.textContent).not.toContain("hint");
    expect(el.textContent).toContain("جارٍ التحميل");
    expect((await render("en", <RecordSummary items={ITEMS(1)} />)).querySelector('[role="group"]')!.hasAttribute("aria-busy")).toBe(false);
  });

  test("long text is cut at 2 lines with the full text in title", async () => {
    const long = "A very long customer name that cannot fit in one cell of the strip";
    const el = await render("en", <RecordSummary items={[{ id: "c", label: "Customer", value: long }]} />);
    const dd = el.querySelector("dd")!;
    expect(dd.className).toContain("line-clamp-2");
    expect(dd.getAttribute("title")).toBe(long);
  });

  test("value styling, hint, and a link with the router link isolated in bdi", async () => {
    const el = await render("ar", <RecordSummary items={[{ id: "c", label: "العميل", value: "مؤسسة الريان للتجارة", href: "/clients/1", hint: "الرياض" }]} />);
    const [value, hint] = el.querySelectorAll("dd");
    expect(value!.className).toMatch(/text-lg.*font-semibold/);
    expect(value!.className).toContain("tabular-nums");
    const a = value!.querySelector("a")!;
    expect([a.getAttribute("href"), a.hasAttribute("data-router")]).toEqual(["/clients/1", true]);
    expect(a.firstElementChild!.tagName).toBe("BDI");
    expect([hint!.textContent, hint!.className]).toEqual(["الرياض", "text-xs text-fg-3"]);
  });

  test("money in Arabic keeps Western digits and the Riyal sign", async () => {
    const el = await render("ar", <RecordSummary items={[{ id: "t", label: "الإجمالي", value: <Money amount={1150} /> }]} />);
    expect(el.querySelector("dd")!.textContent).toMatch(/1,150/);
    expect(el.querySelector("dd svg[aria-label]")).not.toBeNull();
    expect(el.textContent).not.toContain("SAR");
  });

  test("logical borders only; the trailing border is clipped by the Surface", async () => {
    const out = html("ar", <RecordSummary items={ITEMS(6)} media={<span>m</span>} />);
    expect(out).not.toMatch(/\b(ml|mr|pl|pr|border-l|border-r|left|right)-/);
    expect(out).toContain("overflow-hidden");
    expect(out).toContain("-me-px");
  });

  test("more than 6 items is a warning in development, not an error", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      const el = await render("en", <RecordSummary items={ITEMS(7)} />);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(el.querySelectorAll("dd").length).toBe(7);
      warn.mockClear();
      await render("en", <RecordSummary items={ITEMS(6)} />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("Card density", () => {
  test("default is unchanged; compact is p-4, header gap-3, title text-base", async () => {
    const def = await render("en", <Card title="T" description="D">x</Card>);
    expect(def.querySelector("[class*='p-6']")).not.toBeNull();
    expect(def.querySelector("h3")!.className).toContain("text-lg");
    expect(def.querySelector("h3")!.parentElement!.parentElement!.className).toContain("gap-4");
    const compact = await render("en", <Card title="T" density="compact">x</Card>);
    expect(compact.querySelector("[class*='p-4']")).not.toBeNull();
    expect(compact.querySelector("[class*='p-6']")).toBeNull();
    expect(compact.querySelector("h3")!.className).toContain("text-base");
    expect(compact.querySelector("h3")!.className).not.toContain("text-lg");
    expect(compact.querySelector("h3")!.parentElement!.parentElement!.className).toContain("gap-3");
  });
});

const FACTS = [{ term: "Name", details: "Sara" }, { term: "City", details: null }];

describe("DescriptionList layout and density", () => {
  const rows = (el: Element) => [...el.querySelectorAll("dl > div")];
  test("stack and columns are unchanged (columns follow the screen)", async () => {
    const stack = await render("en", <DescriptionList items={FACTS} />);
    expect(rows(stack)[0]!.className).toBe("grid gap-1 text-sm py-3");
    expect(stack.querySelector("dl")!.className).not.toContain("@container");
    const cols = await render("en", <DescriptionList items={FACTS} layout="columns" />);
    expect(rows(cols)[0]!.className).toContain("md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    expect(rows(cols)[0]!.className).not.toContain("@md:");
  });

  test('layout="auto" follows the list width: 28rem (@md), no screen breakpoints', async () => {
    const el = await render("ar", <DescriptionList items={FACTS} layout="auto" />);
    expect(el.querySelector("dl")!.className).toContain("@container");
    const row = rows(el)[0]!.className;
    expect(row).toContain("@md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    expect(row).toContain("@md:gap-6");
    expect(row).not.toMatch(/(^| )md:/);
  });

  test("compact rows are py-2", async () => {
    const el = await render("en", <DescriptionList items={FACTS} density="compact" />);
    expect(rows(el)[0]!.className).toContain("py-2");
    expect(rows(el)[0]!.className).not.toContain("py-3");
  });
});

describe("RecordSection layout and density", () => {
  test("default is columns by the screen; auto and compact pass through", async () => {
    const def = await render("en", <RecordSection title="Customer" items={FACTS} />);
    expect(def.querySelector("dl > div")!.className).toContain("md:grid-cols-[");
    expect(def.querySelector("dl > div")!.className).toContain("py-3");
    expect(def.querySelector("h2")!.className).toContain("text-lg");
    const auto = await render("ar", <RecordSection title="العميل" items={FACTS} layout="auto" density="compact" />);
    expect(auto.querySelector("dl")!.className).toContain("@container");
    expect(auto.querySelector("dl > div")!.className).toContain("@md:grid-cols-[");
    expect(auto.querySelector("dl > div")!.className).toContain("py-2");
    expect(auto.querySelector("h2")!.className).toContain("text-base");
    expect(auto.querySelector("[class*='p-4']")).not.toBeNull();
    // Empty details still show the Not set word.
    expect(auto.querySelectorAll("dd")[1]!.textContent).toBe("غير محدد");
  });
});

const LINES: LineItem[] = [
  {
    id: "1",
    name: "Front brake kit",
    sku: "KIT-1",
    quantity: 1,
    unitPrice: 230,
    total: 230,
    media: { src: "/kit.png", alt: "Front brake kit photo" },
    description: "VAT 15%",
    parts: [
      { id: "a", name: "Brake disc", sku: "BD-12", quantity: 2 },
      { id: "b", name: "Pad set", quantity: 1 },
    ],
    extra: <span data-extra="">Red</span>,
  },
  { id: "2", name: "Oil", quantity: 2, unitPrice: 10, total: 20 },
];
const TOTALS = [{ label: "Subtotal", amount: 250 }, { label: "Total", amount: 250, total: true }];
const table = (lang: "en" | "ar", props: Partial<ComponentProps<typeof LineItemsTable>> = {}) =>
  render(lang, <LineItemsTable lines={LINES} caption="Lines" prices="incl" {...props} />);

describe("LineItemsTable record details", () => {
  test("without the new props the cell and the markup are as before", async () => {
    const el = await table("en", { lines: LINES.slice(1) });
    expect(el.querySelector("ul")).toBeNull();
    expect(el.querySelector("img, span.border")).toBeNull();
    expect(el.firstElementChild!.tagName).toBe("DIV");
    expect(el.querySelector("[data-extra]")).toBeNull();
  });

  test("media, description, parts and extra show under the name", async () => {
    const el = await table("en");
    const cell = el.querySelector("tbody tr td")!;
    const img = cell.querySelector("img")!;
    expect([img.getAttribute("src"), img.getAttribute("alt")]).toEqual(["/kit.png", "Front brake kit photo"]);
    expect(img.closest("span.border")!.className).toContain("size-10");
    expect(cell.textContent).toContain("VAT 15%");
    expect(cell.querySelector("[data-extra]")!.textContent).toBe("Red");
    expect([...cell.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Brake disc (BD-12) × 2", "Pad set × 1"]);
    // The order: name, SKU, description, parts, extra.
    const text = cell.textContent!;
    expect([text.indexOf("Front brake kit"), text.indexOf("KIT-1"), text.indexOf("VAT 15%"), text.indexOf("Brake disc"), text.indexOf("Red")]).toEqual(
      [...[text.indexOf("Front brake kit"), text.indexOf("KIT-1"), text.indexOf("VAT 15%"), text.indexOf("Brake disc"), text.indexOf("Red")]].sort((a, b) => a - b),
    );
    // The second line has none of it.
    expect(el.querySelectorAll("tbody tr")[1]!.querySelector("ul")).toBeNull();
  });

  test("the parts list is named in both languages; the part SKU is LTR; the quantity is a Western digit, LTR", async () => {
    expect((await table("en")).querySelector("ul")!.getAttribute("aria-label")).toBe("Kit parts");
    const ar = await table("ar", { lines: [{ ...LINES[0]!, parts: [{ id: "a", name: "فحمة يمين", sku: "BP-01", quantity: 2 }] }] });
    expect(ar.querySelector("ul")!.getAttribute("aria-label")).toBe("مكونات الطقم");
    const [sku, qty] = ar.querySelectorAll("li bdi");
    expect([sku!.getAttribute("dir"), sku!.textContent, qty!.getAttribute("dir"), qty!.textContent]).toEqual(["ltr", "BP-01", "ltr", "× 2"]);
    // The kit's own SKU stays a mono LTR span.
    expect([...ar.querySelectorAll("tbody span")].find((s) => s.textContent === "KIT-1")!.getAttribute("dir")).toBe("ltr");
  });

  test("phones: the same name cell is the card title, so the details show in card rows", async () => {
    const el = await table("en");
    expect(el.querySelector("thead")!.className).toContain("max-md:sr-only");
    const first = el.querySelector("tbody tr td")!;
    expect(first.className).toContain("max-md:flex-1");
    expect(first.querySelector("ul")).not.toBeNull();
    expect(first.className).not.toContain("max-md:hidden");
  });

  test("totals: a TotalsList under the table at the end side, full width on narrow tables", async () => {
    const el = await table("en", { totals: TOTALS, className: "max-w-4xl" });
    const wrap = el.firstElementChild!;
    expect(wrap.className).toContain("@container");
    expect(wrap.className).toContain("max-w-4xl");
    const dl = wrap.querySelector(":scope > dl")!;
    expect(dl.className).toContain("w-full");
    expect(dl.className).toContain("@xl:max-w-sm");
    expect(dl.className).toContain("@xl:justify-self-end");
    expect([...dl.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Subtotal", "Total"]);
    expect(wrap.children[0]!.querySelector("table")).not.toBeNull();
    expect(dl.querySelector("svg[aria-label]")).not.toBeNull();
    // Arabic: the same, the amounts in Western digits.
    expect((await table("ar", { totals: TOTALS })).querySelector("dl dd")!.textContent).toMatch(/250\.00/);
    // No totals: the table keeps its className and has no wrapper.
    expect((await table("en", { className: "x-1" })).firstElementChild!.className).toContain("x-1");
  });

  test("empty replaces the rows when there are no lines; the default word otherwise", async () => {
    const el = await table("en", { lines: [], empty: "No lines yet" });
    const cell = el.querySelector("tbody td")!;
    expect(cell.textContent).toBe("No lines yet");
    expect(cell.querySelector("p")!.className).toContain("text-fg-3");
    expect((await table("ar", { lines: [], empty: "لا توجد بنود" })).querySelector("tbody td")!.textContent).toBe("لا توجد بنود");
    expect((await table("en", { lines: [] })).querySelector("tbody td")!.textContent).toBe("No results");
    // With lines, empty is not shown.
    expect((await table("en", { empty: "No lines yet" })).textContent).not.toContain("No lines yet");
  });
});
