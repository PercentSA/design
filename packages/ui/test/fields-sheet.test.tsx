import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, StrictMode, useState } from "react";
import { FieldsSheet, ValueRow, type SheetField } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const savedMatchMedia = globalThis.matchMedia;
const wide = (matches: boolean) => {
  globalThis.matchMedia = ((q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
};
afterEach(() => {
  globalThis.matchMedia = savedMatchMedia;
});

const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');
const alert = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
const inputs = () => [...sheet()!.querySelectorAll<HTMLInputElement>("input")];
const save = () => sheet()!.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));
const type = (input: HTMLInputElement, text: string) =>
  act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    set.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const submit = () => act(async () => void sheet()!.querySelector("form")!.requestSubmit());

const fields: SheetField[] = [
  { key: "port", label: "Port", value: "8080", check: (t) => (/^\d+$/.test(t) && +t >= 1 && +t <= 65535 ? undefined : "Enter a port from 1 to 65535") },
  { key: "path", label: "Health check path", value: "/health", mono: true },
];

function Host({ onSubmit, fieldList = fields, strict }: { onSubmit: (v: Record<string, string>) => void | Promise<unknown>; fieldList?: SheetField[]; strict?: boolean }) {
  const [open, setOpen] = useState(false);
  const body = (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <span data-testid="open">{String(open)}</span>
      <FieldsSheet title="Edit start" fields={fieldList} open={open} onOpenChange={setOpen} onSubmit={onSubmit} />
    </>
  );
  return strict ? <StrictMode>{body}</StrictMode> : body;
}
const openIt = async () => {
  await click([...document.querySelectorAll("button")].find((b) => b.textContent === "Open")!);
  await settle();
};
const isOpen = () => document.querySelector('[data-testid="open"]')!.textContent;

describe("ValueRow", () => {
  test("shows the value, copy and action at the end; an empty value shows Not set; mono sets the mono font", async () => {
    const el = await mount(
      <>
        <ValueRow label="Domain" value="shop.example.com" copy="shop.example.com" action={<button>Edit</button>} mono />
        <ValueRow label="Port" value="" />
        <ValueRow label="Path" value={null} />
      </>,
    );
    const groups = el.querySelectorAll('[role="group"]');
    expect(groups.length).toBe(3);
    const control = groups[0]!.lastElementChild!;
    const kids = [...control.querySelectorAll("button")].map((b) => b.textContent);
    expect(control.textContent).toContain("shop.example.com");
    expect(kids.at(-1)).toBe("Edit");
    expect(control.querySelectorAll("button").length).toBe(2);
    const value = [...control.querySelectorAll("span")].find((s) => s.textContent === "shop.example.com")!;
    expect(value.className).toContain("font-mono");
    expect(value.className).toContain("break-all");
    expect(groups[1]!.textContent).toContain("Not set");
    expect(groups[2]!.textContent).toContain("Not set");
    expect(groups[1]!.querySelectorAll("button").length).toBe(0);
  });
});

describe("FieldsSheet", () => {
  test("no error before the first submit; errors show after it and follow the input", async () => {
    const onSubmit = mock(() => {});
    await mount(<Host onSubmit={onSubmit} />);
    await openIt();
    await type(inputs()[0]!, "abc");
    expect(sheet()!.textContent).not.toContain("Enter a port");
    await submit();
    expect(sheet()!.textContent).toContain("Enter a port from 1 to 65535");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(inputs()[0]!);
    expect(inputs()[0]!.getAttribute("aria-invalid")).toBe("true");
    await type(inputs()[0]!, "9000");
    expect(sheet()!.textContent).not.toContain("Enter a port");
  });

  test("a valid submit calls onSubmit with the values and closes", async () => {
    const onSubmit = mock((_v: Record<string, string>) => {});
    await mount(<Host onSubmit={onSubmit} />);
    await openIt();
    await type(inputs()[0]!, "9000");
    await submit();
    expect(onSubmit).toHaveBeenCalledWith({ port: "9000", path: "/health" });
    await settle();
    expect(isOpen()).toBe("false");
  });

  test("a Promise keeps Save loading; a rejected Promise keeps the sheet open", async () => {
    let resolve!: () => void;
    let reject!: (e: Error) => void;
    let n = 0;
    const onSubmit = () => new Promise<void>((res, rej) => (n++ === 0 ? (resolve = res) : (reject = rej)));
    const unhandled = mock(() => {});
    process.on("unhandledRejection", unhandled);
    await mount(<Host onSubmit={onSubmit} />);
    await openIt();
    await submit();
    expect(save().getAttribute("aria-busy")).toBe("true");
    expect(isOpen()).toBe("true");
    await act(async () => resolve());
    await settle();
    expect(isOpen()).toBe("false");
    await openIt();
    await submit();
    await act(async () => reject(new Error("no")));
    await settle();
    expect(isOpen()).toBe("true");
    expect(save().getAttribute("aria-busy")).toBeNull();
    expect(unhandled).not.toHaveBeenCalled();
    process.off("unhandledRejection", unhandled);
  });

  test("values start from the fields each time it opens", async () => {
    await mount(<Host onSubmit={() => {}} strict />);
    await openIt();
    expect(inputs()[0]!.value).toBe("8080");
    await type(inputs()[0]!, "9001");
    expect(inputs()[0]!.value).toBe("9001");
    await submit();
    await settle();
    await openIt();
    expect(inputs()[0]!.value).toBe("8080");
  });

  test("a changed field makes the sheet ask before it closes", async () => {
    await mount(<Host onSubmit={() => {}} />);
    await openIt();
    const cancel = [...sheet()!.querySelectorAll("button")].find((b) => b.textContent === "Cancel")!;
    await click(cancel);
    await settle();
    expect(alert()).toBeNull();
    expect(isOpen()).toBe("false");
    await openIt();
    await type(inputs()[1]!, "/ready");
    await click([...sheet()!.querySelectorAll("button")].find((b) => b.textContent === "Cancel")!);
    await settle();
    expect(alert()).not.toBeNull();
    expect(isOpen()).toBe("true");
  });

  test("suggestions use Autocomplete; mono sets the mono font", async () => {
    await mount(
      <Host
        onSubmit={() => {}}
        fieldList={[
          { key: "path", label: "Path", value: "/", mono: true, suggestions: [{ value: "/health" }] },
          { key: "name", label: "Name", value: "x", mono: true },
        ]}
      />,
    );
    await openIt();
    const [auto, plain] = inputs();
    expect(auto!.getAttribute("role")).toBe("combobox");
    expect(plain!.getAttribute("role")).toBeNull();
    expect(auto!.className).toContain("font-mono");
    expect(plain!.className).toContain("font-mono");
  });

  test("it opens from the bottom below 768 px", async () => {
    wide(false);
    await mount(<Host onSubmit={() => {}} />);
    await openIt();
    expect(sheet()!.getAttribute("data-side")).toBe("bottom");
  });

  test("it opens from the end from 768 px", async () => {
    wide(true);
    await mount(<Host onSubmit={() => {}} />);
    await openIt();
    expect(sheet()!.getAttribute("data-side")).toBe("end");
  });
});
