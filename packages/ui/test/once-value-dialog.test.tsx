import { describe, expect, mock, test } from "bun:test";
import { act } from "react";
import { OnceValueDialog } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));
const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

const open = (onDone = () => {}) =>
  mount(<OnceValueDialog open title="Server token" description="Copy it now." note="You cannot see this value again." value="pt_example_1234" onDone={onDone} />);

describe("OnceValueDialog", () => {
  test("shows the value in mono with Copy, the description and the note", async () => {
    await open();
    expect(dialog()!.textContent).toContain("Server token");
    expect(dialog()!.textContent).toContain("Copy it now.");
    expect(dialog()!.textContent).toContain("You cannot see this value again.");
    const value = [...dialog()!.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent === "pt_example_1234")!;
    expect(value.className).toContain("font-mono");
    expect(button("Copy")).toBeTruthy();
    expect(button("Cancel")).toBeUndefined();
  });

  test("the note is in aria-describedby with the description", async () => {
    await open();
    const ids = dialog()!.getAttribute("aria-describedby")!.split(" ");
    const text = ids.map((id) => document.getElementById(id)?.textContent);
    expect(text).toEqual(["Copy it now.", "You cannot see this value again."]);
  });

  test("first focus is on Copy", async () => {
    await open();
    await settle();
    expect(document.activeElement).toBe(button("Copy"));
  });

  test("Escape and an outside click do not close it", async () => {
    const onDone = mock();
    await open(onDone);
    await settle();
    await press(dialog()!, { key: "Escape" });
    await act(async () => {
      document.querySelector("[data-state=open].fixed")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect([onDone.mock.calls.length, !!dialog()]).toEqual([0, true]);
  });

  test("Done calls onDone once", async () => {
    const onDone = mock();
    await open(onDone);
    await click(button("Done"));
    expect(onDone.mock.calls.length).toBe(1);
  });
});
