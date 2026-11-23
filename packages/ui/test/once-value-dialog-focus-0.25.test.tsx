import { describe, expect, test } from "bun:test";
import { act, useRef, useState } from "react";
import { OnceValueDialog } from "../src";
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

describe("OnceValueDialog returnFocusTo", () => {
  test("opened after another dialog closed, the focus returns to returnFocusTo", async () => {
    await mount(<Flow withTarget />);
    // The element that had the focus at open is gone (a closed dialog): the focus is on the body.
    const opener = button("Open");
    await click(opener);
    (document.activeElement as HTMLElement | null)?.blur();
    await settle();
    await click(button("Done"));
    await settle();
    expect(document.activeElement).toBe(button("Menu trigger"));
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
