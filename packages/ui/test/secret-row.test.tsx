import { describe, expect, mock, test } from "bun:test";
import { act } from "react";
import { SecretRow, SettingsSection } from "../src";
import { click, mount, press, stubMatchMedia, useDom } from "./dom";

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
// A typed value makes Cancel ask first; this confirms the question.
const discard = async () => {
  await settle();
  await click(button("Discard", document.body));
  await settle();
};
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

  test("an onSave that throws at once acts as a rejected save", async () => {
    const el = await save(() => {
      throw new Error("Bad key.");
    });
    await click(button("Set", el));
    await type(field(), "bad");
    await click(button("Save", sheet()!));
    await settle();
    expect(sheet()!.textContent).toContain("Bad key.");
    await click(button("Cancel", sheet()!));
    await discard();
    expect(sheet()).toBeNull();
    await click(button("Set", el));
    expect(field().value).toBe("");
  });

  test("a typed value asks before it is dropped; a saved value closes without the question", async () => {
    const el = await save();
    await click(button("Set", el));
    await type(field(), "abc");
    await press(sheet()!, { key: "Escape" });
    await settle();
    expect(document.body.textContent).toContain("Discard your changes?");
    await click(button("Discard", document.body));
    await settle();
    expect(sheet()).toBeNull();
    await click(button("Set", el));
    expect(field().value).toBe("");
    await type(field(), "abc");
    await click(button("Save", sheet()!));
    await settle();
    expect(sheet()).toBeNull();
    expect(document.body.textContent).not.toContain("Discard your changes?");
  });

  test("the typed value is empty after each close", async () => {
    const el = await save(async () => {
      throw new Error("No.");
    });
    // Cancel
    await click(button("Set", el));
    await type(field(), "one");
    await click(button("Cancel", sheet()!));
    await discard();
    await click(button("Set", el));
    expect(field().value).toBe("");
    // after a failed save, then Cancel
    await type(field(), "two");
    await click(button("Save", sheet()!));
    await settle();
    await click(button("Cancel", sheet()!));
    await discard();
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

describe("SecretRow sheet, 0.24", () => {
  const openMenu = async (el: Element) => {
    await act(async () => {
      el.querySelector('button[aria-label="More actions"]')!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ctrlKey: false }));
    });
    await settle();
  };

  test("the sheet title follows the value state", async () => {
    const a = await mount(<SecretRow label="API key" canEdit secret={{ set: false }} onSave={async () => {}} />);
    await click(button("Set", a));
    expect(sheet()!.textContent).toContain("Set API key");
    expect(sheet()!.textContent).not.toContain("Change API key");
    await click(sheet()!.querySelector('button[aria-label="Close"]')!);
    await settle();
    document.body.innerHTML = "";
    const b = await mount(<SecretRow label="Token" canEdit secret={{ set: true }} onSave={async () => {}} />);
    await click(button("Change", b));
    expect(sheet()!.textContent).toContain("Change Token");
  });

  test("sheetDescription and hint show", async () => {
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: false }} sheetDescription="Paste the key from the provider." hint="Starts with sk_." onSave={async () => {}} />);
    await click(button("Set", el));
    expect(sheet()!.textContent).toContain("Paste the key from the provider.");
    const hint = [...sheet()!.querySelectorAll("*")].find((n) => n.children.length === 0 && n.textContent === "Starts with sk_.")!;
    expect(hint).toBeTruthy();
    expect(field().getAttribute("aria-describedby")).toContain(hint.id);
  });

  test("a chosen file fills the field", async () => {
    const el = await mount(<SecretRow label="Key" pem canEdit secret={{ set: false }} file={{ accept: ".pem,text/plain", label: "Choose a key file" }} onSave={async () => {}} />);
    await click(button("Set", el));
    const input = sheet()!.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.getAttribute("accept")).toBe(".pem,text/plain");
    expect(button("Choose a key file", sheet()!)).toBeTruthy();
    const file = new File(["-----BEGIN KEY-----\nabc\n-----END KEY-----"], "key.pem", { type: "text/plain" });
    await act(async () => {
      Object.defineProperty(input, "files", { configurable: true, value: [file] });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await settle();
    expect((field() as HTMLTextAreaElement).value).toBe("-----BEGIN KEY-----\nabc\n-----END KEY-----");
    // The content is in the field only, not in the page text.
    const elsewhere = [...sheet()!.querySelectorAll("*")].filter((n) => n !== field() && !n.contains(field()) && n.textContent!.includes("BEGIN KEY"));
    expect(elsewhere).toEqual([]);
  });

  test("removeLabel names the item and the action", async () => {
    const onRemove = mock(async () => {});
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: true }} removeLabel="Delete key" onSave={async () => {}} onRemove={onRemove} />);
    await openMenu(el);
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Delete key")!;
    expect(item).toBeTruthy();
    await click(item);
    await settle();
    const alert = document.querySelector('[role="alertdialog"]') as HTMLElement;
    await click(button("Delete key", alert));
    await settle();
    expect(onRemove.mock.calls.length).toBe(1);
  });

  test("without the new props the sheet and the menu say what they said before", async () => {
    const el = await mount(<SecretRow label="API key" canEdit secret={{ set: true }} onSave={async () => {}} onRemove={async () => {}} />);
    await openMenu(el);
    expect([...document.querySelectorAll('[role="menuitem"]')].map((i) => i.textContent)).toEqual(["Remove"]);
    expect(el.querySelector('input[type="file"]')).toBeNull();
  });
});
