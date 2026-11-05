// Form and phone-tool parts (0.12.0): LineItemsEditor, FormBar, PinPad, AppShell without a sidebar, Sheet size, FormSheet blocked/danger/cancelLabel/bottom footer.
import { afterAll, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AppShell,
  Button,
  Field,
  FormBar,
  FormSheet,
  Input,
  LineItemsEditor,
  Money,
  PercentProvider,
  PinPad,
  Sheet,
  STRINGS,
  type LineEditorColumn,
} from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const html = (node: ReactNode, lang: "en" | "ar" = "en") => renderToStaticMarkup(<PercentProvider lang={lang}>{node}</PercentProvider>);
const dom = (node: ReactNode, lang: "en" | "ar" = "en") => {
  const doc = document.createElement("div");
  doc.innerHTML = html(node, lang);
  return doc;
};
const hasClass = (el: Element, ...names: string[]) => names.every((n) => el.className.split(/\s+/).includes(n));
const inLang = (node: ReactNode, lang: "en" | "ar") => <PercentProvider lang={lang}>{node}</PercentProvider>;
const buttonNamed = (root: ParentNode, name: string) => [...root.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent) === name) as HTMLButtonElement;
const tick = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));

describe("AppShell without a sidebar", () => {
  test("no sidebar column, no menu button, no sheet; the header row shows at every width", () => {
    const doc = dom(<AppShell header={<span>Logo</span>}>Page</AppShell>);
    const root = doc.firstElementChild!;
    expect(root.className).not.toContain("lg:grid");
    expect(doc.querySelector('[aria-label="Open navigation"]')).toBeNull();
    expect(doc.querySelector("nav, aside")).toBeNull();
    const header = doc.querySelector("header")!;
    expect(hasClass(header, "sticky", "h-14", "border-b", "bg-bg/90")).toBe(true);
    expect(header.className).not.toMatch(/lg:hidden|lg:col-start-2/);
    expect(header.textContent).toBe("Logo");
    expect(hasClass(root, "[--p-sticky-top:3.5rem]")).toBe(true);
    expect(root.className).not.toContain("lg:[--p-sticky-top:0px]");
    const main = doc.querySelector("main")!;
    expect([main.id, main.textContent, main.className.includes("lg:col-start-2")]).toEqual(["main", "Page", false]);
    expect(doc.querySelector('a[href="#main"]')).not.toBeNull();
  });

  test("no sidebar and no header: only main, and a development warning", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    const doc = dom(<AppShell>Page</AppShell>);
    expect([doc.querySelector("header"), doc.querySelector("main")?.textContent]).toEqual([null, "Page"]);
    expect(hasClass(doc.firstElementChild!, "[--p-sticky-top:0px]")).toBe(true);
    await mount(<AppShell>Page</AppShell>);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("AppShell"))).toBe(true);
    warn.mockRestore();
  });

  test("with a sidebar nothing changes", () => {
    const doc = dom(<AppShell sidebar={<nav>Menu</nav>} header={<span>Top</span>}>Page</AppShell>);
    const root = doc.firstElementChild!;
    expect(hasClass(root, "lg:grid", "lg:grid-cols-[auto_minmax(0,1fr)]")).toBe(true);
    expect(doc.querySelector('[aria-label="Open navigation"]')).not.toBeNull();
    expect(hasClass(doc.querySelector("header")!, "lg:col-start-2", "lg:px-6")).toBe(true);
    expect(doc.querySelector("header")!.className).not.toContain("lg:hidden");
    expect(doc.querySelector("main")!.className).toContain("lg:col-start-2");
  });

  test("in Arabic the same frame renders", () => {
    const doc = dom(<AppShell header={<span>شعار</span>}>الصفحة</AppShell>, "ar");
    expect([doc.querySelector("header")!.textContent, doc.querySelector("main")!.textContent]).toEqual(["شعار", "الصفحة"]);
  });
});

describe("Sheet size", () => {
  const content = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
  const sheet = async (props: { size?: "md" | "lg"; side?: "end" | "start" | "bottom" }) => {
    await mount(<Sheet open title="Convert" {...props} />);
    return content().className;
  };
  test("md is 28rem (as before)", async () => {
    expect((await sheet({})).split(" ")).toContain("w-[min(100%,28rem)]");
  });
  test("lg is 56rem on a side sheet, instead of 28rem", async () => {
    const cls = (await sheet({ size: "lg" })).split(" ");
    expect(cls).toContain("w-[min(100%,56rem)]");
    expect(cls).not.toContain("w-[min(100%,28rem)]");
  });
  test("lg also works on the start side", async () => {
    expect((await sheet({ size: "lg", side: "start" })).split(" ")).toContain("w-[min(100%,56rem)]");
  });
  test("a bottom sheet ignores size", async () => {
    expect(await sheet({ size: "lg", side: "bottom" })).not.toContain("56rem");
  });
});

describe("FormSheet", () => {
  const footer = () => document.querySelector<HTMLElement>("form > div.sticky")!;
  const buttonsRow = () => footer().lastElementChild!;
  const submit = () => document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const form = (props: Partial<Parameters<typeof FormSheet>[0]> = {}, lang: "en" | "ar" = "en") =>
    mount(
      inLang(
        <FormSheet open title="Complete the job" onSubmit={(e) => e.preventDefault()} {...props}>
          <Field label="Note">
            <Input name="note" defaultValue="x" />
          </Field>
        </FormSheet>,
        lang,
      ),
    );

  test("without the new props the footer and buttons are as before", async () => {
    await form();
    expect(footer().className).toContain("sticky bottom-0");
    expect(buttonsRow().className).toBe("flex flex-wrap justify-end gap-2");
    expect(footer().querySelector('[role="status"]')!.childElementCount).toBe(0);
    expect([submit().disabled, submit().textContent, submit().className.includes("bg-primary"), buttonNamed(footer(), "Cancel") != null]).toEqual([false, "Save", true, true]);
    expect(submit().hasAttribute("aria-describedby")).toBe(false);
  });

  test("blocked: the reason shows in a status area, the submit stays visible but disabled and points to the reason", async () => {
    const onSubmit = mock((e: { preventDefault(): void }) => e.preventDefault());
    await form({ blocked: "A machining charge is not paid.", onSubmit });
    const status = footer().querySelector('[role="status"]')!;
    expect(status.textContent).toBe("A machining charge is not paid.");
    expect(status.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
    expect(submit().disabled).toBe(true);
    expect(status.querySelector("p")!.id).toBe(submit().getAttribute("aria-describedby")!);
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("the reason appears later inside the same status element (so it is announced)", async () => {
    function Later() {
      const [reason, setReason] = useState<string | null>(null);
      return (
        <FormSheet open title="T" blocked={reason} onSubmit={(e) => e.preventDefault()}>
          <Button onClick={() => setReason("Pay first.")}>Refuse</Button>
        </FormSheet>
      );
    }
    await mount(<Later />);
    const status = footer().querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    await click(buttonNamed(document.body, "Refuse"));
    expect([footer().querySelector('[role="status"]'), status.textContent, submit().disabled]).toEqual([status, "Pay first.", true]);
  });

  test("an empty reason (null, empty text, false) refuses nothing", async () => {
    for (const blocked of [null, "", false, undefined]) {
      await form({ blocked });
      expect([footer().querySelector('[role="status"]')!.childElementCount, submit().disabled]).toEqual([0, false]);
    }
  });

  test("pending wins over blocked: loading, no reason", async () => {
    await form({ blocked: "Pay first.", pending: true });
    expect([submit().getAttribute("aria-busy"), submit().disabled, footer().querySelector('[role="status"]')!.childElementCount]).toEqual(["true", false, 0]);
  });

  test("blocked with dirty: the close button still asks first", async () => {
    await form({ blocked: "Pay first.", dirty: true });
    await click(buttonNamed(footer(), "Cancel"));
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  });

  test("danger makes the submit a danger button; cancelLabel renames the close button", async () => {
    await form({ danger: true, cancelLabel: "Go back", submitLabel: "Cancel the job" });
    expect(submit().className).toContain("bg-danger");
    expect(submit().className).not.toContain("bg-primary");
    expect(footer().textContent).toBe("Go backCancel the job");
  });

  test("side bottom: two equal columns at every width, large buttons", async () => {
    await form({ side: "bottom" });
    const row = buttonsRow();
    expect(hasClass(row, "grid", "grid-cols-2", "gap-3")).toBe(true);
    expect(row.className).not.toMatch(/sm:|md:|lg:/);
    for (const b of row.querySelectorAll("button")) expect(b.className).toContain("h-(--p-control-h)");
  });

  test("size lg widens the sheet", async () => {
    await form({ size: "lg" });
    expect(document.querySelector('[role="dialog"]')!.className).toContain("w-[min(100%,56rem)]");
  });

  test("Arabic: the reason, the labels and the strings", async () => {
    await form({ blocked: "اختر سبب الإلغاء.", cancelLabel: "تراجع", submitLabel: "إلغاء الموعد", danger: true, side: "bottom" }, "ar");
    expect(footer().textContent).toBe("اختر سبب الإلغاء.تراجعإلغاء الموعد");
    expect(submit().disabled).toBe(true);
  });
});

describe("FormBar", () => {
  test("summary at the start, buttons at the end, sticky; one row from 640 px, stacked below it", () => {
    const doc = dom(
      <FormBar
        summary={
          <>
            Total: <b>1,150</b>
          </>
        }
      >
        <Button variant="secondary">Cancel</Button>
        <Button type="submit">Create</Button>
      </FormBar>,
    );
    const bar = doc.firstElementChild!;
    expect(hasClass(bar, "border-t", "border-line", "bg-surface", "py-3", "gap-2", "sticky", "bottom-0", "flex-col", "sm:flex-row", "sm:items-center")).toBe(true);
    const [summary, buttons] = [...bar.children];
    expect(summary.getAttribute("role")).toBe("status");
    expect(hasClass(summary, "text-sm", "sm:flex-1", "min-w-0")).toBe(true);
    expect(summary.className).toContain("[&_b]:font-medium");
    // Phone: the buttons share the row, each flex-1; from 640 px they sit at the end.
    expect(hasClass(buttons, "flex", "gap-2", "max-sm:*:flex-1", "sm:justify-end")).toBe(true);
    expect([...buttons.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Cancel", "Create"]);
  });

  test("no summary: buttons only; sticky={false}: not sticky; className is merged", () => {
    const doc = dom(
      <FormBar sticky={false} className="extra">
        <Button>Save</Button>
      </FormBar>,
    );
    const bar = doc.firstElementChild!;
    expect(bar.childElementCount).toBe(1);
    expect(bar.querySelector('[role="status"]')).toBeNull();
    expect(bar.className).not.toContain("sticky");
    expect(bar.className).toContain("extra");
  });

  test("a changed summary stays in the same status element; works in Arabic, with the submit last", async () => {
    function Bar() {
      const [n, setN] = useState(1);
      return (
        <FormBar summary={`${n} منتج`}>
          <Button onClick={() => setN(n + 1)}>إلغاء</Button>
          <Button type="submit">حفظ</Button>
        </FormBar>
      );
    }
    const el = await mount(inLang(<Bar />, "ar"));
    const status = el.querySelector('[role="status"]')!;
    await click(el.querySelector("button")!);
    expect([el.querySelector('[role="status"]'), status.textContent]).toEqual([status, "2 منتج"]);
    expect([...el.querySelectorAll("button")].at(-1)!.type).toBe("submit");
  });
});

describe("PinPad", () => {
  const keys = (root: ParentNode) => [...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
  const key = (root: ParentNode, name: string) => keys(root).find((b) => b.textContent === name)!;
  const type = async (root: ParentNode, digits: string) => {
    for (const d of digits) await click(key(root, d));
  };
  const status = (root: ParentNode) => root.querySelector<HTMLElement>('[role="status"]')!;
  const dots = (root: ParentNode) => [...root.querySelectorAll('[aria-hidden="true"][dir="ltr"] > span')];
  const filled = (root: ParentNode) => dots(root).filter((d) => d.className.includes("bg-fg")).length;
  const pressKey = (init: KeyboardEventInit, target: EventTarget = document.body) =>
    act(async () => {
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
    });

  test("a group with the label, dots, and keys in phone order; the clear key has a name", async () => {
    const el = await mount(<PinPad label="Enter the lock code" onComplete={() => {}} />);
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).toBe("Enter the lock code");
    expect(keys(el).map((b) => b.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Clear"]);
    expect(dots(el).length).toBe(4);
    expect(keys(el).every((b) => b.type === "button" && b.className.includes("h-14") && b.className.includes("border-line-strong"))).toBe(true);
    // The grid has an empty cell before 0.
    const grid = el.querySelector(".grid-cols-3")!;
    expect(grid.children[9].tagName).toBe("SPAN");
    expect(grid.children[10].textContent).toBe("0");
  });

  test("onComplete gets the code once, on the last digit; onStart fires at the first digit only", async () => {
    const onComplete = mock((_: string) => {});
    const onStart = mock(() => {});
    const el = await mount(<PinPad label="Code" onComplete={onComplete} onStart={onStart} />);
    await type(el, "12");
    expect([onStart.mock.calls.length, onComplete.mock.calls.length, filled(el)]).toEqual([1, 0, 2]);
    await type(el, "34");
    expect(onComplete.mock.calls).toEqual([["1234"]]);
    expect(onStart.mock.calls.length).toBe(1);
    await tick();
    // The pad cleared; a new entry starts again.
    expect(filled(el)).toBe(0);
    await type(el, "5");
    expect(onStart.mock.calls.length).toBe(2);
  });

  test("length 6; the Clear key removes the last digit", async () => {
    const onComplete = mock((_: string) => {});
    const el = await mount(<PinPad length={6} label="Cashier code" onComplete={onComplete} />);
    expect(dots(el).length).toBe(6);
    await type(el, "123");
    await click(key(el, "Clear"));
    expect(filled(el)).toBe(2);
    await type(el, "4567");
    expect(onComplete.mock.calls).toEqual([["124567"]]);
  });

  test("two taps in the same frame both count", async () => {
    const onComplete = mock((_: string) => {});
    const el = await mount(<PinPad length={2} label="Code" onComplete={onComplete} />);
    await act(async () => {
      key(el, "7").click();
      key(el, "8").click();
      key(el, "9").click();
    });
    expect(onComplete.mock.calls).toEqual([["78"]]);
  });

  test("screen readers hear a count, never the digits; the dots are hidden from them", async () => {
    const el = await mount(<PinPad label="Code" onComplete={() => {}} />);
    expect(status(el).textContent).toBe("");
    await type(el, "42");
    expect(status(el).textContent).toBe("2 of 4");
    expect(status(el).getAttribute("aria-live")).toBe("polite");
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("");
    expect(dots(el).every((d) => d.textContent === "")).toBe(true);
    expect(el.querySelector('[aria-hidden="true"][dir="ltr"]')!.textContent).toBe("");
    expect(el.querySelector('input[type="hidden"], output')).toBeNull();
  });

  test("busy: while the promise runs the keys are off and the pad says so; then it clears and the keys come back", async () => {
    let done!: () => void;
    const el = await mount(<PinPad length={2} label="Code" onComplete={() => new Promise<void>((r) => (done = r))} />);
    await type(el, "12");
    const group = el.querySelector('[role="group"]')!;
    expect([group.getAttribute("aria-busy"), keys(el).every((b) => b.disabled)]).toEqual(["true", true]);
    await act(async () => done());
    expect([group.getAttribute("aria-busy"), keys(el).some((b) => b.disabled), filled(el)]).toEqual([null, false, 0]);
  });

  test("a wrong code: the error shows as an alert and the dots are empty; the next digit drops it", async () => {
    function Lock() {
      const [wrong, setWrong] = useState(false);
      return <PinPad length={2} label="Code" error={wrong ? "Wrong code" : undefined} onStart={() => setWrong(false)} onComplete={() => setWrong(true)} />;
    }
    const el = await mount(<Lock />);
    await type(el, "12");
    const alert = el.querySelector('[role="alert"]')!;
    expect([alert.textContent, filled(el), alert.className.includes("text-danger")]).toEqual(["Wrong code", 0, true]);
    await type(el, "1");
    expect([alert.textContent, filled(el)]).toEqual(["", 1]);
  });

  test("an error set from outside clears the dots", async () => {
    function Outside() {
      const [error, setError] = useState<string | undefined>();
      return (
        <>
          <button onClick={() => setError("Locked")}>lock</button>
          <PinPad label="Code" error={error} onComplete={() => {}} />
        </>
      );
    }
    const el = await mount(<Outside />);
    await type(el, "12");
    expect(filled(el)).toBe(2);
    await click(el.querySelector("button")!);
    expect([el.querySelector('[role="alert"]')!.textContent, filled(el)]).toEqual(["Locked", 0]);
  });

  test("hardware keyboard: digits (also Arabic-Indic) and Backspace; not while a text field has the focus", async () => {
    const onComplete = mock((_: string) => {});
    const el = await mount(
      <>
        <input id="other" />
        <PinPad label="Code" onComplete={onComplete} />
      </>,
    );
    await pressKey({ key: "1" });
    await pressKey({ key: "٢" });
    await pressKey({ key: "9" });
    await pressKey({ key: "Backspace" });
    expect(filled(el)).toBe(2);
    await pressKey({ key: "3" }, el.querySelector("#other")!);
    expect(filled(el)).toBe(2);
    await pressKey({ key: "4", ctrlKey: true });
    await pressKey({ key: "a" });
    expect(filled(el)).toBe(2);
    await pressKey({ key: "٣" });
    await pressKey({ key: "4" });
    expect(onComplete.mock.calls).toEqual([["1234"]]);
  });

  test("disabled: the keys are off and the keyboard does nothing", async () => {
    const el = await mount(<PinPad label="Code" disabled onComplete={() => {}} />);
    expect(keys(el).every((b) => b.disabled)).toBe(true);
    await pressKey({ key: "1" });
    expect(filled(el)).toBe(0);
  });

  test("Arabic: names, progress and left-to-right order of the keys and dots", async () => {
    const el = await mount(inLang(<PinPad label="أدخل رمز القفل" error="رمز غير صحيح" onComplete={() => {}} />, "ar"));
    expect(keys(el).at(-1)!.textContent).toBe("مسح");
    expect(el.querySelector(".grid-cols-3")!.getAttribute("dir")).toBe("ltr");
    expect(el.querySelector('[aria-hidden="true"][dir="ltr"]')).not.toBeNull();
    await type(el, "12");
    expect(status(el).textContent).toBe("2 من 4");
    expect(STRINGS.ar.pinPad.clear).toBe("مسح");
  });
});

// happy-dom has no layout: the editor reads its width from a ResizeObserver that the tests fire by hand.
describe("LineItemsEditor", () => {
  const observers: ResizeObserverCallback[] = [];
  const savedRO = globalThis.ResizeObserver;
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        observers.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });
  afterAll(() => {
    globalThis.ResizeObserver = savedRO;
  });
  const width = (w: number) => act(async () => observers.forEach((cb) => cb([{ contentRect: { width: w } } as ResizeObserverEntry], {} as ResizeObserver)));

  type L = { id: string; name: string; qty: number };
  let seq = 0;
  const columns = (): LineEditorColumn<L>[] => [
    {
      key: "name",
      header: "Product",
      width: "fill",
      card: "title",
      cell: (l, ctx) => (
        <Field label="Product">
          <Input defaultValue={l.name} onKeyDown={(e) => e.key === "p" && (e.preventDefault(), ctx.next())} />
        </Field>
      ),
    },
    {
      key: "qty",
      header: "Quantity",
      width: "xs",
      cell: (l) => (
        <Field label="Quantity" hint={l.qty > 5 ? "Many" : undefined} error={l.qty === 0 ? "Required" : undefined}>
          <Input defaultValue={String(l.qty)} />
        </Field>
      ),
    },
    { key: "total", header: "Total", width: "sm", align: "end", readOnly: true, card: "end", cell: (l) => <Money amount={l.qty * 10} decimals={2} /> },
  ];
  const start = (n: number): L[] => Array.from({ length: n }, (_, i) => ({ id: `l${i + 1}`, name: `Item ${i + 1}`, qty: i + 1 }));

  type Props = Partial<Parameters<typeof LineItemsEditor<L>>[0]>;
  function Harness({ count = 2, lang = "en", submit, ...props }: Props & { count?: number; lang?: "en" | "ar"; submit?: () => void }) {
    const [lines, setLines] = useState(start(count));
    return (
      <PercentProvider lang={lang}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit?.();
          }}
        >
          <LineItemsEditor<L>
            caption="Products"
            hideCaption
            lines={lines}
            getKey={(l) => l.id}
            columns={columns()}
            onAdd={() => setLines((x) => [...x, { id: `n${++seq}`, name: "", qty: 1 }])}
            onRemove={(i) => setLines((x) => x.filter((_, j) => j !== i))}
            {...props}
          />
        </form>
      </PercentProvider>
    );
  }
  const inputs = (root: ParentNode) => [...root.querySelectorAll<HTMLInputElement>("input")];
  const enter = async (el: Element) => {
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await act(async () => {
      el.dispatchEvent(e);
    });
    return e;
  };
  const live = (root: ParentNode) => root.querySelector('[role="status"]')!.textContent;

  test("the server renders rows: caption, # column, headers, add button, trash names, Field labels hidden with the line", () => {
    const doc = dom(<Harness />);
    const table = doc.querySelector("table")!;
    expect(table.querySelector("caption")!.className).toBe("sr-only");
    expect([...table.querySelectorAll("th")].map((th) => th.textContent)).toEqual(["#", "Product", "Quantity", "Total", "Line actions"]);
    expect(doc.querySelectorAll("tbody tr").length).toBe(2);
    expect(buttonNamed(doc, "Add line")).toBeDefined();
    expect(buttonNamed(doc, "Remove line 2")).toBeDefined();
    const label = doc.querySelectorAll("tbody label")[1];
    expect(label.className).toContain("sr-only");
    expect(label.textContent).toBe("Quantity, Line 1");
    expect(doc.querySelector("tbody tr")!.textContent).toContain("10.00");
  });

  test("column widths become minimum widths of the headers; fill takes the rest", () => {
    const heads = [...dom(<Harness />).querySelectorAll("th")];
    expect(heads[1].className).toContain("w-full");
    expect(heads[1].className).toContain("min-w-56");
    expect(heads[2].className).toContain("min-w-24");
    expect(heads[3].className).toContain("min-w-32");
    expect(heads[3].className).toContain("text-end");
  });

  test("Arabic: the built-in strings and the line in the accessible name", () => {
    const doc = dom(<Harness lang="ar" />, "ar");
    expect(buttonNamed(doc, "إضافة بند")).toBeDefined();
    expect(buttonNamed(doc, "حذف البند 1")).toBeDefined();
    expect(doc.querySelector("tbody label")!.textContent).toContain("البند 1");
    expect(STRINGS.ar.lines.added(4)).toBe("أُضيف البند 4");
    expect(STRINGS.ar.lines.removed(3)).toBe("حُذف البند 3");
  });

  test("rows or line cards by the measured width; cards show labels and group each line", async () => {
    const el = await mount(<Harness hideCaption={false} />);
    expect(el.querySelector("table")).not.toBeNull();
    await width(400);
    expect(el.querySelector("table")).toBeNull();
    const cards = [...el.querySelectorAll("li")];
    expect(cards.length).toBe(2);
    const group = cards[0].querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).toBe("Line 1");
    // Labels show on cards, without the line suffix; the read-only total gets its header as a label.
    const label = group.querySelector("label")!;
    expect([label.className.includes("sr-only"), el.querySelectorAll("li label")[1].textContent]).toEqual([false, "Quantity"]);
    expect(group.textContent).toContain("Total");
    expect(group.className).toContain("p-3");
    expect(group.querySelector("[style*='--min']")).not.toBeNull();
    expect(el.querySelector("ul")!.getAttribute("aria-labelledby")).toBe(el.querySelector("p[id$='-caption']")!.id);
    await width(1100);
    expect([el.querySelector("table") != null, el.querySelector("li")]).toEqual([true, null]);
  });

  test("the column minimums plus # and the buttons decide: 14 + 6 + 8 + 2.5 + 2 buttons of 2.5 = 35.5rem", async () => {
    const el = await mount(<Harness detail={() => null} />);
    await width(570);
    expect(el.querySelector("table")).not.toBeNull();
    await width(560);
    expect(el.querySelector("table")).toBeNull();
  });

  test("Enter in a cell moves to the next editable cell, then the next line, and never submits", async () => {
    const submit = mock(() => {});
    const el = await mount(<Harness submit={submit} />);
    const [name1, qty1, name2, qty2] = inputs(el);
    name1.focus();
    const e = await enter(name1);
    expect([e.defaultPrevented, document.activeElement]).toEqual([true, qty1]);
    await enter(qty1);
    expect(document.activeElement).toBe(name2);
    await enter(name2);
    expect(document.activeElement).toBe(qty2);
    expect(submit).not.toHaveBeenCalled();
  });

  test("Enter in the last cell of the last line adds a line, focuses its first editable cell and announces it", async () => {
    const el = await mount(<Harness />);
    const last = inputs(el).at(-1)!;
    last.focus();
    await enter(last);
    expect(inputs(el).length).toBe(6);
    expect(document.activeElement).toBe(inputs(el)[4]);
    expect(live(el)).toBe("Line 3 added");
  });

  test("the add button adds a line and focuses it too", async () => {
    const el = await mount(<Harness />);
    await click(buttonNamed(el, "Add line"));
    expect([inputs(el).length, document.activeElement === inputs(el)[4], live(el)]).toEqual([6, true, "Line 3 added"]);
  });

  test("a cell that handled Enter itself (a Combobox with its list open) keeps it", async () => {
    const el = await mount(<Harness columns={[{ ...columns()[0], cell: () => <input aria-label="pick" onKeyDown={(e) => e.preventDefault()} /> }]} />);
    const input = el.querySelector("input")!;
    input.focus();
    await enter(input);
    expect(document.activeElement).toBe(input);
    expect(inputs(el).length).toBe(2);
  });

  test("Enter on a button is left alone", async () => {
    const el = await mount(<Harness />);
    const e = await enter(buttonNamed(el, "Remove line 1"));
    expect(e.defaultPrevented).toBe(false);
  });

  test("ctx.next moves to the next editable cell of the line (after a pick)", async () => {
    const el = await mount(<Harness />);
    const [name1, qty1] = inputs(el);
    name1.focus();
    await act(async () => {
      name1.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(qty1);
  });

  test("remove: the focus goes to the line that took its place; the last line sends it to the add button; both are announced", async () => {
    const el = await mount(<Harness count={3} />);
    await click(buttonNamed(el, "Remove line 1"));
    expect([inputs(el).length, document.activeElement === inputs(el)[0], live(el)]).toEqual([4, true, "Line 1 removed"]);
    await click(buttonNamed(el, "Remove line 2"));
    expect([document.activeElement, live(el)]).toEqual([buttonNamed(el, "Add line"), "Line 2 removed"]);
  });

  test("removing a line without an add button announces it and keeps the focus in the editor", async () => {
    const el = await mount(<Harness count={2} onAdd={undefined} />);
    await click(buttonNamed(el, "Remove line 1"));
    expect(live(el)).toBe("Line 1 removed");
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("no trash without onRemove or when canRemove says no; no add button without onAdd", () => {
    expect(dom(<Harness onRemove={undefined} />).querySelector('[aria-label^="Remove"]')).toBeNull();
    const doc = dom(<Harness onAdd={undefined} canRemove={(_, i) => i > 0} />);
    expect([doc.querySelector('[aria-label="Remove line 1"]'), doc.querySelector('[aria-label="Remove line 2"]') != null, buttonNamed(doc, "Add line") === undefined]).toEqual([null, true, true]);
  });

  test("disabled: no add, no trash, no menu; the details toggle stays", () => {
    const doc = dom(<Harness disabled detail={() => <span>More</span>} lineActions={() => [{ label: "Duplicate" }]} />);
    expect([buttonNamed(doc, "Add line") === undefined, doc.querySelector('[aria-label^="Remove"]'), doc.querySelector('[aria-label^="Line actions "]')]).toEqual([true, null, null]);
    expect(doc.querySelector('[aria-label="Line details 1"]')).not.toBeNull();
  });

  test("details open under the row, with aria-expanded and aria-controls; closed details are not rendered", async () => {
    const el = await mount(
      <Harness
        detail={(l) => (
          <Field label="Note">
            <Input defaultValue={`note ${l.id}`} />
          </Field>
        )}
      />,
    );
    const toggle = buttonNamed(el, "Line details 2");
    expect([toggle.getAttribute("aria-expanded"), el.querySelector('[role="group"]')]).toEqual(["false", null]);
    await click(toggle);
    const panel = el.querySelector<HTMLElement>('[role="group"]')!;
    expect([toggle.getAttribute("aria-expanded"), toggle.getAttribute("aria-controls") === panel.id, panel.textContent]).toEqual(["true", true, "Note"]);
    expect(panel.closest("td")!.className).toContain("bg-surface-2");
    expect(panel.closest("td")!.getAttribute("colspan")).toBe("5");
    // The detail label is visible (it is not in a cell).
    expect(panel.querySelector("label")!.className).not.toContain("sr-only");
    await click(toggle);
    expect(el.querySelector('[role="group"]')).toBeNull();
  });

  test("controlled open details", async () => {
    const onChange = mock((_: string[]) => {});
    const el = await mount(<Harness openDetails={["l1"]} onOpenDetailsChange={onChange} detail={() => <span>Shown</span>} />);
    expect(el.querySelectorAll('[role="group"]').length).toBe(1);
    await click(buttonNamed(el, "Line details 2"));
    expect(onChange.mock.calls).toEqual([[["l1", "l2"]]]);
    expect(el.querySelectorAll('[role="group"]').length).toBe(1);
  });

  test("details on a card sit under the fields", async () => {
    const el = await mount(<Harness detail={() => <span>Shown</span>} openDetails={["l1"]} />);
    await width(400);
    expect(el.querySelector("li div.border-t [role='group']")!.textContent).toBe("Shown");
  });

  test("the line menu button is named with the line", () => {
    const doc = dom(<Harness lineActions={(l) => [{ label: `Duplicate ${l.id}` }]} />);
    expect(buttonNamed(doc, "Line actions 2")).toBeDefined();
    expect(buttonNamed(doc, "Line actions 2").getAttribute("aria-haspopup")).toBe("menu");
  });

  test("totals, empty text, loading rows and a list error linked to the table", () => {
    const doc = dom(<Harness totals={[{ label: "Total", amount: 1150, total: true }]} error="Add at least one line." />);
    expect(doc.querySelector("dl")!.textContent).toContain("1,150.00");
    expect(doc.querySelector("dl")!.className).toContain("@xl:max-w-sm");
    const err = doc.querySelector("p.text-danger")!;
    expect(doc.querySelector("table")!.getAttribute("aria-describedby")).toBe(err.id);
    const none = dom(<Harness count={0} empty="Choose a purchase order first." onAdd={undefined} />);
    expect(none.querySelector("tbody")!.textContent).toBe("Choose a purchase order first.");
    const wait = dom(<Harness loading empty="x" />);
    expect([wait.querySelectorAll("tbody tr").length, wait.querySelector("table")!.getAttribute("aria-busy"), wait.querySelector("tbody")!.textContent]).toEqual([3, "true", ""]);
  });

  test("an empty list still offers the add button, and adding focuses the new line", async () => {
    const el = await mount(<Harness count={0} empty="Nothing yet" />);
    expect(el.textContent).toContain("Nothing yet");
    await click(buttonNamed(el, "Add line"));
    expect([inputs(el).length, document.activeElement === inputs(el)[0], live(el)]).toEqual([2, true, "Line 1 added"]);
  });

  test("numbered={false} drops the # column; addLabel renames the button", () => {
    const doc = dom(<Harness numbered={false} addLabel="Add a product" />);
    expect([...doc.querySelectorAll("th")].map((th) => th.textContent)).toEqual(["Product", "Quantity", "Total", "Line actions"]);
    expect(buttonNamed(doc, "Add a product")).toBeDefined();
  });

  test("the hint and the error of a Field show in the cell", () => {
    const doc = dom(<LineItemsEditor<L> caption="x" lines={[{ id: "a", name: "A", qty: 0 }, { id: "b", name: "B", qty: 9 }]} getKey={(l) => l.id} columns={columns()} />);
    expect([doc.textContent!.includes("Required"), doc.textContent!.includes("Many")]).toEqual([true, true]);
  });
});
