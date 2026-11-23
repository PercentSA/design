import { describe, expect, test } from "bun:test";
import { act, useRef, useState } from "react";
import { AlertDialog, OnceValueDialog } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 20)));
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

function Flow({ withTarget }: { withTarget: boolean }) {
  const [open, setOpen] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={target} type="button">
        Menu trigger
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <OnceValueDialog open={open} title="Token" value="pt_example" onDone={() => setOpen(false)} returnFocusTo={withTarget ? target : undefined} />
    </>
  );
}

// The confirm dialog closes and the once dialog opens: the element focused at open is the confirm button, which is gone.
function After({ withTarget }: { withTarget: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [once, setOnce] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={target} type="button" onClick={() => setConfirm(true)}>
        Menu trigger
      </button>
      <AlertDialog open={confirm} onOpenChange={setConfirm} title="Rotate?" action="Rotate" onAction={() => (setConfirm(false), setOnce(true))} />
      <OnceValueDialog open={once} title="Token" value="pt_example" onDone={() => setOnce(false)} returnFocusTo={withTarget ? target : undefined} />
    </>
  );
}

describe("OnceValueDialog returnFocusTo", () => {
  test("opened after another dialog closed, the focus returns to returnFocusTo", async () => {
    await mount(<After withTarget />);
    const trigger = button("Menu trigger");
    trigger.focus();
    await click(trigger);
    await settle();
    await click(button("Rotate"));
    await settle();
    document.body.focus();
    await click(button("Done"));
    await settle();
    expect(document.activeElement).toBe(trigger);
  });

  test("a returnFocusTo ref with no element returns the focus to the element focused at open", async () => {
    function Empty() {
      const [open, setOpen] = useState(false);
      const none = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <OnceValueDialog open={open} title="Token" value="pt_example" onDone={() => setOpen(false)} returnFocusTo={none} />
        </>
      );
    }
    await mount(<Empty />);
    const opener = button("Open");
    opener.focus();
    await act(async () => opener.click());
    await settle();
    await click(button("Done"));
    await settle();
    expect(document.activeElement).toBe(opener);
  });
  test("without returnFocusTo the focus returns to the element focused at open", async () => {
    await mount(<Flow withTarget={false} />);
    const opener = button("Open");
    opener.focus();
    await act(async () => opener.click());
    await settle();
    await click(button("Done"));
    await settle();
    expect(document.activeElement).toBe(opener);
  });
});
