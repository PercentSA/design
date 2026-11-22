// CommandPalette: description, disabled and badge (0.21.0).
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
    expect(document.body.textContent).toContain("Hosting");
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
});
