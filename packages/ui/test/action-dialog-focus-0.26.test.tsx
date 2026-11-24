import { describe, expect, test } from "bun:test";
import { act, useRef, useState, type RefObject } from "react";
import { ActionDialog, AlertDialog, Dialog, Sheet } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 20)));
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

type Kind = "action" | "dialog" | "alert" | "sheet";

function Part({ kind, open, onClose, returnFocusTo }: { kind: Kind; open: boolean; onClose: () => void; returnFocusTo?: RefObject<HTMLElement | null> }) {
  const state = { open, onOpenChange: (o: boolean) => !o && onClose() };
  if (kind === "action") return <ActionDialog {...state} title="Redeploy" subject={{ title: "Site" }} effects={["It restarts."]} action="Go" onAction={onClose} returnFocusTo={returnFocusTo} />;
  if (kind === "dialog") return <Dialog {...state} title="Edit" returnFocusTo={returnFocusTo}><button type="button" onClick={onClose}>Done</button></Dialog>;
  if (kind === "alert") return <AlertDialog {...state} title="Delete?" action="Delete" onAction={onClose} returnFocusTo={returnFocusTo} />;
  return <Sheet {...state} title="Filters" returnFocusTo={returnFocusTo}><button type="button" onClick={onClose}>Done</button></Sheet>;
}

const closer = { action: "Go", dialog: "Done", alert: "Delete", sheet: "Done" } as const;

function Flow({ kind, mode }: { kind: Kind; mode: "target" | "empty" | "none" }) {
  const [open, setOpen] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  const none = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={target} type="button">Elsewhere</button>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Part kind={kind} open={open} onClose={() => setOpen(false)} returnFocusTo={mode === "target" ? target : mode === "empty" ? none : undefined} />
    </>
  );
}

async function run(kind: Kind, mode: "target" | "empty" | "none") {
  await mount(<Flow kind={kind} mode={mode} />);
  const opener = button("Open");
  opener.focus();
  await act(async () => opener.click());
  await settle();
  await click(button(closer[kind]));
  await settle();
  return { opener, elsewhere: button("Elsewhere") };
}

for (const kind of ["action", "dialog", "alert", "sheet"] as const) {
  describe(`${kind} returnFocusTo`, () => {
    test("with returnFocusTo the focus goes to that element when it closes", async () => {
      const { elsewhere } = await run(kind, "target");
      expect(document.activeElement).toBe(elsewhere);
    });
    test("a returnFocusTo ref with no element returns the focus to the element focused at open", async () => {
      const { opener } = await run(kind, "empty");
      expect(document.activeElement).toBe(opener);
    });
    test("without returnFocusTo, as before", async () => {
      const { opener } = await run(kind, "none");
      expect(document.activeElement).toBe(opener);
    });
  });
}
