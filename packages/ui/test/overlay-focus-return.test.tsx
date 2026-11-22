import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Button, Dialog, PercentProvider, Sheet } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));

// Opened from a button by state, without `trigger` (as FieldsSheet and a menu item do).
function Host({ Part }: { Part: typeof Dialog | typeof Sheet }) {
  const [open, setOpen] = useState(false);
  return (
    <PercentProvider lang="en">
      <Button id="from" onClick={() => setOpen(true)}>Open</Button>
      <Part open={open} onOpenChange={setOpen} title="Edit">
        <p>Body</p>
      </Part>
    </PercentProvider>
  );
}

describe("a Dialog or Sheet without a trigger", () => {
  for (const [name, Part] of [["Dialog", Dialog], ["Sheet", Sheet]] as const) {
    test(`${name}: the focus goes back to the element that opened it`, async () => {
      await mount(<Host Part={Part} />);
      const from = document.getElementById("from")!;
      from.focus();
      await click(from);
      await tick();
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      await click(document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!);
      await tick();
      await tick();
      expect(document.activeElement?.id).toBe("from");
    });
  }
});
