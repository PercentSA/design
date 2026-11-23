import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Button, Dialog, DropdownMenu, PercentProvider } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));

function Host({ fromMenu }: { fromMenu: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <PercentProvider lang="en">
      {fromMenu ? (
        <DropdownMenu trigger={<Button id="trig">Actions</Button>} items={[{ label: "Edit", onSelect: () => setOpen(true) }]} />
      ) : (
        <Button id="trig" onClick={() => setOpen(true)}>Open</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen} title="Edit">
        <p>Body</p>
      </Dialog>
    </PercentProvider>
  );
}

const closeDialog = async () => {
  await click(document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!);
  await tick();
  await tick();
};

describe("focus return, 0.24", () => {
  test("a dialog opened from a menu item gives the focus back to the menu trigger", async () => {
    await mount(<Host fromMenu />);
    const trig = document.getElementById("trig")!;
    trig.focus();
    await act(async () => {
      trig.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    });
    await tick();
    const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
    expect(item).not.toBeNull();
    item.focus();
    await click(item);
    await tick();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await closeDialog();
    expect(document.activeElement?.id).toBe("trig");
  });

  test("a dialog opened from a button gives the focus back to the button", async () => {
    await mount(<Host fromMenu={false} />);
    const trig = document.getElementById("trig")!;
    trig.focus();
    await click(trig);
    await tick();
    await closeDialog();
    expect(document.activeElement?.id).toBe("trig");
  });
});
