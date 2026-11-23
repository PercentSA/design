import { describe, expect, mock, test } from "bun:test";
import { act } from "react";
import { SecretRow, SettingsSection } from "../src";
import { click, mount, stubMatchMedia, useDom } from "./dom";

useDom();

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));
const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');
const button = (text: string, root: ParentNode = document) => [...root.querySelectorAll("button")].find((b) => b.textContent === text)!;
const field = () => sheet()!.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")!;
const type = async (el: HTMLInputElement | HTMLTextAreaElement, text: string) =>
  act(async () => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const NOW = new Date("2026-11-23T12:00:00Z");
const changedAt = new Date(NOW.getTime() - 5 * 60_000);
const save = (onSave = async (_v: string) => {}) => mount(<SettingsSection title="Keys"><SecretRow label="API key" canEdit secret={{ set: false }} onSave={onSave} /></SettingsSection>);

describe("SecretRow", () => {
  test("set secret: Set, Changed, time and by, button Change", async () => {
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: true, changedAt, changedBy: "Sara" }} onSave={async () => {}} />);
    const text = el.textContent!;
    expect(text).toContain("Set");
    expect(text).toContain("Changed");
    expect(text).toContain("by Sara");
    expect(el.querySelector("time")).toBeTruthy();
    expect(button("Change", el)).toBeTruthy();
    expect(button("Set", el)).toBeUndefined();
  });

  test("missing required secret: Not set in the warning color, Without it, button Set", async () => {
    const el = await mount(<SecretRow label="API key" required stops="Payments" canEdit secret={{ set: false }} onSave={async () => {}} />);
    const status = [...el.querySelectorAll("span")].find((s) => s.textContent === "Not set")!;
    expect(status.className).toContain("text-warning");
    expect(el.textContent).toContain("Without it: Payments");
    expect(button("Set", el)).toBeTruthy();
  });

  test("no edit right: no button, the owner shows", async () => {
    const el = await mount(<SecretRow label="API key" canEdit={false} owner="Ask the owner." secret={{ set: true }} onSave={async () => {}} />);
    expect(el.querySelector("button")).toBeNull();
    expect(el.textContent).toContain("Ask the owner.");
  });

  test("save: password field, one call while pending, closes on resolve", async () => {
    let finish!: () => void;
    const onSave = mock((_v: string) => new Promise<void>((r) => (finish = r)));
    const el = await save(onSave);
    await click(button("Set", el));
    const input = field() as HTMLInputElement;
    expect([input.type, input.getAttribute("autocomplete"), input.getAttribute("spellcheck")]).toEqual(["password", "off", "false"]);
    await type(input, "s3cret");
    const submit = sheet()!.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    await click(submit);
    await click(submit);
    expect(onSave.mock.calls).toEqual([["s3cret"]]);
    await act(async () => finish());
    await settle();
    expect(sheet()).toBeNull();
  });

  test("failed save: the sheet stays open and shows the message under the field", async () => {
    const el = await save(async () => {
      throw new Error("The key is not valid.");
    });
    await click(button("Set", el));
    await type(field(), "bad");
    await click(button("Save", sheet()!));
    await settle();
    expect(sheet()).not.toBeNull();
    expect(sheet()!.textContent).toContain("The key is not valid.");
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });

  test("the typed value is empty after each close", async () => {
    const el = await save(async () => {
      throw new Error("No.");
    });
    // Cancel
    await click(button("Set", el));
    await type(field(), "one");
    await click(button("Cancel", sheet()!));
    await settle();
    await click(button("Set", el));
    expect(field().value).toBe("");
    // after a failed save, then Cancel
    await type(field(), "two");
    await click(button("Save", sheet()!));
    await settle();
    await click(button("Cancel", sheet()!));
    await settle();
    await click(button("Set", el));
    expect(field().value).toBe("");
    expect(document.body.innerHTML).not.toContain("two");
  });

  test("Save with an empty field shows an error and does not call onSave", async () => {
    const onSave = mock(async (_v: string) => {});
    const el = await save(onSave);
    await click(button("Set", el));
    await click(button("Save", sheet()!));
    expect(sheet()!.textContent).toContain("Enter a value.");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(onSave.mock.calls.length).toBe(0);
  });

  test("the password field has a Show button and keeps its attributes", async () => {
    const el = await save();
    await click(button("Set", el));
    await click(sheet()!.querySelector('button[aria-label="Show password"]')!);
    const input = field() as HTMLInputElement;
    expect([input.type, input.getAttribute("autocomplete"), input.getAttribute("spellcheck")]).toEqual(["text", "off", "false"]);
  });

  test("the sheet opens again empty after a successful save", async () => {
    const el = await save();
    await click(button("Set", el));
    await type(field(), "first");
    await click(button("Save", sheet()!));
    await settle();
    expect(sheet()).toBeNull();
    await click(button("Set", el));
    expect(field().value).toBe("");
  });

  test("the sheet is at the end from 768 px and at the bottom below", async () => {
    stubMatchMedia(true);
    const el = await save();
    await click(button("Set", el));
    expect(sheet()!.className).toContain("end-0");
    expect(sheet()!.className).not.toContain("bottom-0");
  });

  test("pem: a mono text area of 8 rows", async () => {
    const el = await mount(<SecretRow label="Certificate key" pem canEdit secret={{ set: false }} onSave={async () => {}} />);
    await click(button("Set", el));
    const area = sheet()!.querySelector("textarea")!;
    expect([Number(area.rows), area.className.includes("font-mono"), sheet()!.querySelector("input")]).toEqual([8, true, null]);
  });

  test("remove: the menu asks, then calls onRemove", async () => {
    const onRemove = mock(async () => {});
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: true }} onSave={async () => {}} onRemove={onRemove} />);
    await act(async () => {
      const trigger = el.querySelector('button[aria-label="More actions"]')!;
      trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ctrlKey: false }));
    });
    await settle();
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Remove")!;
    await click(item);
    await settle();
    const alert = document.querySelector('[role="alertdialog"]')!;
    expect(alert.textContent).toContain("Remove API key?");
    expect(onRemove.mock.calls.length).toBe(0);
    await click(button("Remove", alert as HTMLElement));
    await settle();
    expect(onRemove.mock.calls.length).toBe(1);
  });

  test("no onRemove: no menu", async () => {
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: true }} onSave={async () => {}} />);
    expect(el.querySelector('button[aria-label="More actions"]')).toBeNull();
  });

  test("controlled open: shows the sheet, a close calls onOpenChange(false)", async () => {
    const onOpenChange = mock();
    await mount(<SecretRow label="API key" canEdit secret={{ set: false }} onSave={async () => {}} open onOpenChange={onOpenChange} />);
    expect(sheet()).not.toBeNull();
    await click(button("Cancel", sheet()!));
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });
});
