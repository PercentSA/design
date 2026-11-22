// CommandPalette: description, disabled and badge (0.21.0); server results, node descriptions and anchored mode (0.22.0).
import { afterEach, describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { CommandPalette, Money, type Command } from "../src";
import { mount, press, useDom } from "./dom";

useDom();

const noop = () => {};
const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
const type = (value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(), value);
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
const options = () => [...document.querySelectorAll('[role="option"]')];
const highlighted = () => document.getElementById(input().getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;

describe("CommandPalette fields", () => {
  test("a description is shown and searched", async () => {
    const commands: Command[] = [
      { id: "a", label: "Deploy", description: "Send the build to production", onSelect: noop },
      { id: "b", label: "Open settings", onSelect: noop },
    ];
    await mount(<CommandPalette open onOpenChange={noop} commands={commands} />);
    expect(options()[0]!.textContent).toContain("Send the build to production");
    await type("production");
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining("Deploy")]);
  });

  test("a disabled command shows its reason, is skipped by Enter, and the arrows move over it", async () => {
    const log: string[] = [];
    const commands: Command[] = [
      { id: "a", label: "First", onSelect: () => log.push("a") },
      { id: "b", label: "Second", disabled: "Needs a running server", onSelect: () => log.push("b") },
      { id: "c", label: "Third", onSelect: () => log.push("c") },
    ];
    await mount(<CommandPalette open onOpenChange={noop} commands={commands} />);
    const second = options()[1]!;
    expect(second.textContent).toContain("Needs a running server");
    expect(second.getAttribute("aria-disabled")).toBe("true");
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toContain("Second");
    await press(input(), { key: "Enter" });
    expect(log).toEqual([]);
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toContain("Third");
    await press(input(), { key: "Enter" });
    expect(log).toEqual(["c"]);
  });

  test("the description of a disabled command is not shown, so it is not searched", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Deploy", description: "production", disabled: "Needs a server", onSelect: noop }]} />);
    await type("production");
    expect(options()).toEqual([]);
  });

  test("the second line stays readable on the highlighted row", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Deploy", description: "to production", onSelect: noop }]} />);
    expect(options()[0]!.querySelector(".text-xs")!.className).toContain("[[data-highlighted]_&]:text-fg-2");
  });

  test("a badge is in its row", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Deploy", badge: "New", onSelect: noop }]} />);
    expect(options()[0]!.textContent).toContain("New");
  });
});

describe("CommandPalette 0.22.0", () => {
  const savedMedia = globalThis.matchMedia;
  afterEach(() => (globalThis.matchMedia = savedMedia));
  const wide = (on: boolean) =>
    (globalThis.matchMedia = ((q: string) => ({ matches: on, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia);
  const one: Command[] = [{ id: "a", label: "Deploy", onSelect: noop }];

  test('onSearchChange gets "" on open and each typed text', async () => {
    const log: string[] = [];
    await mount(<CommandPalette open onOpenChange={noop} commands={one} onSearchChange={(x) => log.push(x)} />);
    await type("no");
    await type("noura");
    expect(log).toEqual(["", "no", "noura"]);
  });

  test("loading shows the searching row and hides No results", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[]} loading />);
    const status = document.querySelector('[role="status"]')!;
    expect(status.textContent).toContain("Searching");
    expect(status.textContent).not.toContain("No results");
    expect(status.querySelector("svg")).not.toBeNull();
  });

  test("loading as a string shows that text", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[]} loading="Searching hosting…" />);
    expect(document.querySelector('[role="status"]')!.textContent).toContain("Searching hosting…");
  });

  test("server results join the list through the same filter", async () => {
    const commands: Command[] = [
      { id: "a", label: "Deploy", onSelect: noop },
      { id: "s", label: "Noura Ali", group: "Hosting", keywords: ["noura@"], onSelect: noop },
    ];
    await mount(<CommandPalette open onOpenChange={noop} commands={commands} />);
    await type("noura@");
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining("Noura Ali")]);
    const group = options()[0]!.closest('[role="group"]')!;
    expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Hosting");
  });

  test("a node description renders and is never searched", async () => {
    const node = <><Money amount={120} /> · noura@example.com</>;
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Payment", description: node, onSelect: noop }]} />);
    expect(options()[0]!.textContent).toContain("120");
    expect(options()[0]!.querySelector("svg")).not.toBeNull();
    await type("noura");
    expect(options()).toEqual([]);
  });

  test("a node description is found through keywords", async () => {
    const node = <><Money amount={120} /> · noura@example.com</>;
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Payment", description: node, keywords: ["noura@example.com"], onSelect: noop }]} />);
    await type("noura");
    expect(options()).toHaveLength(1);
  });

  const withAnchor = async (isWide: boolean, onOpenChange: (o: boolean) => void = noop) => {
    await act(async () => void (await new Promise((r) => setTimeout(r, 20)))); // let the focus return of the previous test finish
    wide(isWide);
    const btn = document.createElement("button");
    document.body.append(btn);
    const Host = () => {
      const [open, setOpen] = useState(true);
      return <CommandPalette open={open} onOpenChange={(o) => (setOpen(o), onOpenChange(o))} commands={one} anchor={{ current: btn }} />;
    };
    await mount(<Host />);
    return btn;
  };

  test("anchor from 768 px: a popover next to the anchor, with no backdrop", async () => {
    await withAnchor(true);
    expect(document.querySelector(".p-overlay")).toBeNull();
    expect(document.querySelector("[data-radix-popper-content-wrapper] [role=\"combobox\"]")).not.toBeNull();
  });

  test("anchor below 768 px: a bottom sheet", async () => {
    await withAnchor(false);
    expect(document.querySelector('[role="dialog"]')!.className).toContain("bottom-0");
    expect(document.querySelector("[data-radix-popper-content-wrapper]")).toBeNull();
  });

  for (const isWide of [true, false]) {
    test(`anchor (${isWide ? "popover" : "sheet"}): the input has the focus and the first row is highlighted`, async () => {
      await withAnchor(isWide);
      expect(document.activeElement).toBe(input());
      expect(highlighted()).toContain("Deploy");
    });

    test(`anchor (${isWide ? "popover" : "sheet"}): Escape closes and the focus goes back to the anchor`, async () => {
      let open = true;
      const btn = await withAnchor(isWide, (o) => (open = o));
      await press(input(), { key: "Escape" });
      expect(open).toBe(false);
      await act(async () => void (await new Promise((r) => setTimeout(r, 20)))); // Radix returns the focus in a timeout
      expect(document.activeElement).toBe(btn);
    });
  }

  const wait = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));

  test("the dialog without anchor does not call matchMedia", async () => {
    globalThis.matchMedia = (() => {
      throw new Error("matchMedia called");
    }) as unknown as typeof matchMedia;
    await mount(<CommandPalette open onOpenChange={noop} commands={one} />);
    expect(options()).toHaveLength(1);
  });

  test("the popover has a height limit", async () => {
    await withAnchor(true);
    expect(document.querySelector('[role="dialog"]')!.className).toContain("var(--radix-popover-content-available-height)");
  });

  test("the bottom sheet uses the Sheet classes", async () => {
    await withAnchor(false);
    const c = document.querySelector('[role="dialog"]')!;
    expect(c.getAttribute("data-side")).toBe("bottom");
    expect(c.className).toContain("p-sheet");
    expect(c.className).toContain("border-t");
  });

  for (const isWide of [true, false]) {
    const name = isWide ? "popover" : "sheet";
    test(`anchor (${name}): an outside press closes`, async () => {
      let open = true;
      await withAnchor(isWide, (o) => (open = o));
      await wait();
      await act(async () => {
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); // Radix finishes an outside press on the click
      });
      await wait();
      expect(open).toBe(false);
    });
  }

  // A modal dialog traps the focus while it is open, so there a command moves the focus after the close; Radix then finds it moved.
  const focusCases: [string, boolean, boolean][] = [["popover", true, true], ["sheet", false, true], ["dialog without anchor", false, false]];
  for (const [name, isWide, anchored] of focusCases) {
    test(`${name}: a command that focuses a new input keeps the focus there`, async () => {
      wide(isWide);
      await wait();
      const field = document.createElement("input");
      document.body.append(field);
      const btn = document.createElement("button");
      document.body.append(btn);
      const Host = () => {
        const [open, setOpen] = useState(true);
        const commands = [{ id: "f", label: "Add field", onSelect: () => (isWide && anchored ? field.focus() : setTimeout(() => field.focus(), 0)) }];
        return <CommandPalette open={open} onOpenChange={setOpen} commands={commands} anchor={anchored ? { current: btn } : undefined} />;
      };
      await mount(<Host />);
      await press(input(), { key: "Enter" });
      await wait();
      expect(document.activeElement).toBe(field);
    });
  }

  test("popover: an outside click on another input keeps the focus on that input", async () => {
    let open = true;
    await withAnchor(true, (o) => (open = o));
    await wait();
    const other = document.createElement("input");
    document.body.append(other);
    await act(async () => {
      other.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      other.focus();
      other.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await wait();
    expect(open).toBe(false);
    expect(document.activeElement).toBe(other);
  });
});
