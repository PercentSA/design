import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Button, CommandPalette, ContextMenu, Dialog, DropdownMenu, PercentProvider } from "../src";
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

describe("focus return, 0.24 fix round 1", () => {
  test("a dialog opened from a context menu item gives the focus back to the element that had it", async () => {
    function CtxHost() {
      const [open, setOpen] = useState(false);
      return (
        <PercentProvider lang="en">
          <ContextMenu items={[{ label: "Edit", onSelect: () => setOpen(true) }]}>
            <div id="area">
              <button type="button" id="inner">Row</button>
            </div>
          </ContextMenu>
          <Dialog open={open} onOpenChange={setOpen} title="Edit">
            <p>Body</p>
          </Dialog>
        </PercentProvider>
      );
    }
    await mount(<CtxHost />);
    const inner = document.getElementById("inner")!;
    inner.focus();
    await act(async () => {
      inner.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
    });
    await tick();
    const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
    expect(item).not.toBeNull();
    item.focus();
    await click(item);
    await tick();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await closeDialog();
    expect(document.activeElement?.id).toBe("inner");
  });

  test("a dialog opened from a pointer-opened menu gives the focus back to the menu trigger", async () => {
    await mount(<Host fromMenu />);
    const trig = document.getElementById("trig")!;
    await act(async () => {
      trig.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ctrlKey: false }));
    });
    await tick();
    const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
    item.focus();
    await click(item);
    await tick();
    await closeDialog();
    expect(document.activeElement?.id).toBe("trig");
  });
});

describe("focus return of the command palette, 0.24 fix round 1", () => {
  test("a palette opened from a menu item gives the focus back to the menu trigger", async () => {
    function PaletteHost() {
      const [open, setOpen] = useState(false);
      return (
        <PercentProvider lang="en">
          <DropdownMenu trigger={<Button id="trig">Actions</Button>} items={[{ label: "Search", onSelect: () => setOpen(true) }]} />
          <CommandPalette open={open} onOpenChange={setOpen} commands={[{ id: "a", label: "Deploy", onSelect: () => {} }]} />
        </PercentProvider>
      );
    }
    await mount(<PaletteHost />);
    const trig = document.getElementById("trig")!;
    await act(async () => {
      trig.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ctrlKey: false }));
    });
    await tick();
    const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
    item.focus();
    await click(item);
    await tick();
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    expect(input).not.toBeNull();
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    await tick();
    await tick();
    expect(document.activeElement?.id).toBe("trig");
  });
});
