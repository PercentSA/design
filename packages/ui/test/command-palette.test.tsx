// CommandPalette: description, disabled and badge (0.21.0).
import { describe, expect, test } from "bun:test";
import { act } from "react";
import { CommandPalette, type Command } from "../src";
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

  test("a badge is in its row", async () => {
    await mount(<CommandPalette open onOpenChange={noop} commands={[{ id: "a", label: "Deploy", badge: "New", onSelect: noop }]} />);
    expect(options()[0]!.textContent).toContain("New");
  });
});
