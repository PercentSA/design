import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Dialog, PageHeader } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 20)));
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader title="Orders" menu={[{ label: "Suspend…", onSelect: () => setOpen(true) }]} />
      <Dialog open={open} onOpenChange={setOpen} title="Suspend">
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      </Dialog>
    </>
  );
}

describe("PageHeader More actions focus", () => {
  test("a dialog opened from a More actions item gives the focus back to More actions", async () => {
    await mount(<Page />);
    const toggle = [...document.querySelectorAll("button")].find((b) => b.hasAttribute("aria-controls") && b.textContent?.includes("More actions"))!;
    await click(toggle);
    await click(button("Suspend…"));
    await settle();
    await click(button("Cancel"));
    await settle();
    expect(document.activeElement).toBe(toggle);
  });
});
