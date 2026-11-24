import { describe, expect, test } from "bun:test";
import { act, useRef, useState, type RefObject } from "react";
import { FieldsSheet, FormSheet } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 20)));
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

type Kind = "form" | "fields";

function Part({ kind, open, onClose, returnFocusTo }: { kind: Kind; open: boolean; onClose: () => void; returnFocusTo?: RefObject<HTMLElement | null> }) {
  if (kind === "form") {
    return (
      <FormSheet title="Edit" open={open} onOpenChange={(o) => !o && onClose()} onSubmit={(e) => (e.preventDefault(), onClose())} returnFocusTo={returnFocusTo}>
        <p>Body</p>
      </FormSheet>
    );
  }
  return <FieldsSheet title="Edit" open={open} onOpenChange={(o) => !o && onClose()} fields={[{ key: "a", label: "Name", value: "Al Noor" }]} onSubmit={() => {}} returnFocusTo={returnFocusTo} />;
}

function Flow({ kind, withTarget }: { kind: Kind; withTarget: boolean }) {
  const [open, setOpen] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={target} type="button">Elsewhere</button>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Part kind={kind} open={open} onClose={() => setOpen(false)} returnFocusTo={withTarget ? target : undefined} />
    </>
  );
}

async function run(kind: Kind, withTarget: boolean) {
  await mount(<Flow kind={kind} withTarget={withTarget} />);
  const opener = button("Open");
  opener.focus();
  await act(async () => opener.click());
  await settle();
  await click(button("Save"));
  await settle();
  return { opener, elsewhere: button("Elsewhere") };
}

for (const kind of ["form", "fields"] as const) {
  describe(`${kind} sheet returnFocusTo`, () => {
    test("with returnFocusTo the focus goes to that element when it closes", async () => {
      const { elsewhere } = await run(kind, true);
      expect(document.activeElement).toBe(elsewhere);
    });
    test("without returnFocusTo, as before", async () => {
      const { opener } = await run(kind, false);
      expect(document.activeElement).toBe(opener);
    });
  });
}
