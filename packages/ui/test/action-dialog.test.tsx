import { describe, expect, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { ActionDialog, Button, PercentProvider, RadioGroup, TimeText, type ActionDialogProps } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const setValue = (el: HTMLInputElement | HTMLTextAreaElement) =>
  Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value")!.set!;
async function edit(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  await act(async () => {
    el.focus();
    setValue(el).call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));

const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement;
const buttons = () => [...dialog().querySelectorAll<HTMLButtonElement>("button")];
const named = (name: string) => buttons().find((b) => b.textContent?.trim() === name)!;
const field = (sel: string) => dialog().querySelector<HTMLInputElement>(sel)!;

const base = { title: "Do it?", subject: { title: "Main website" }, effects: ["It stops."], action: "Do it" } satisfies Partial<ActionDialogProps>;
function Host(props: Partial<ActionDialogProps> & { children?: ReactNode }) {
  return <ActionDialog open onOpenChange={() => {}} onAction={() => {}} {...base} {...props} />;
}

describe("ActionDialog", () => {
  test("shows the subject, the choices and What happens as a live region", async () => {
    await mount(
      <Host subject={{ title: "Main website", value: "SAR 40", meta: "Since May", facts: [{ term: "Plan", value: "Pro" }] }} notice={<p>Careful</p>}>
        <RadioGroup options={[{ value: "a", label: "Option A" }]} />
      </Host>,
    );
    const text = dialog().textContent!;
    for (const part of ["Do it?", "Main website", "SAR 40", "Since May", "Plan", "Pro", "Careful", "Option A", "What happens", "It stops."]) expect(text).toContain(part);
    const live = dialog().querySelector('section[aria-live="polite"]')!;
    expect(live.querySelector("h3")!.textContent).toBe("What happens");
    expect(live.querySelectorAll("ul li")).toHaveLength(1);
  });

  test("effects null shows effectsEmpty", async () => {
    await mount(<Host effects={null} effectsEmpty="Choose a reason first." />);
    const live = dialog().querySelector('section[aria-live="polite"]')!;
    expect(live.textContent).toContain("Choose a reason first.");
    expect(live.querySelector("ul")).toBeNull();
  });

  test("first focus goes to the first choice, never to a time in the subject", async () => {
    await mount(
      <Host subject={{ title: "Main website", meta: <TimeText value="2026-05-01T10:00:00Z" /> }}>
        <RadioGroup options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />
      </Host>,
    );
    await tick();
    expect(document.activeElement).toBe(dialog().querySelector('[role="radio"]'));
  });

  test("first focus skips a disabled first control", async () => {
    await mount(
      <Host>
        <input aria-label="Off" disabled />
        <input aria-label="On" />
      </Host>,
    );
    await tick();
    expect(document.activeElement).toBe(dialog().querySelector('input[aria-label="On"]'));
  });

  test("first focus skips a disabled first radio", async () => {
    await mount(
      <Host>
        <RadioGroup options={[{ value: "a", label: "A", disabled: true }, { value: "b", label: "B" }]} />
      </Host>,
    );
    await tick();
    expect(document.activeElement).toBe(dialog().querySelectorAll('[role="radio"]')[1]);
  });

  test("effects null without effectsEmpty shows no empty paragraph", async () => {
    await mount(<Host effects={null} />);
    expect(dialog().querySelector('section[aria-live="polite"] p')).toBeNull();
  });

  test("the typed name accepts Arabic-Indic digits", async () => {
    await mount(<Host confirmName="web-2" />);
    await edit(field("input"), "web-٢");
    expect(named("Do it").getAttribute("aria-disabled")).toBeNull();
  });

  test("a name with Arabic-Indic digits matches either digit set", async () => {
    for (const typed of ["خادم ٢", "خادم 2"]) {
      await mount(<Host confirmName="خادم ٢" />);
      await edit(field("input"), typed);
      expect(named("Do it").getAttribute("aria-disabled")).toBeNull();
    }
  });

  test("without choices or fields the first focus is on Cancel", async () => {
    await mount(<Host subject={{ title: "Main website", meta: <TimeText value="2026-05-01T10:00:00Z" /> }} />);
    await tick();
    expect(document.activeElement).toBe(named("Cancel"));
  });

  test("with a reason field and no choices the first focus is on the reason, then the name", async () => {
    await mount(<Host reason={{ label: "Why" }} confirmName="x" />);
    await tick();
    expect(document.activeElement?.tagName).toBe("TEXTAREA");
  });

  test("with only a name field the first focus is on it", async () => {
    await mount(<Host confirmName="x" />);
    await tick();
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  test("with confirmName the action stays refused until the text matches", async () => {
    let calls = 0;
    await mount(<Host confirmName="Main website" onAction={() => calls++} />);
    expect(dialog().textContent).toContain("Type Main website to confirm.");
    const input = field("input");
    expect(input.autocomplete).toBe("off");
    await edit(input, "main website");
    expect(named("Do it").getAttribute("aria-disabled")).toBe("true");
    await click(named("Do it"));
    expect(calls).toBe(0);
    await edit(input, " Main website ");
    expect(named("Do it").getAttribute("aria-disabled")).toBeNull();
    await click(named("Do it"));
    expect(calls).toBe(1);
  });

  test("a required reason needs text, and onAction gets it", async () => {
    const got: (string | undefined)[] = [];
    await mount(<Host reason={{ label: "Reason", required: true }} onAction={(r) => got.push(r)} />);
    await click(named("Do it"));
    expect(got).toEqual([]);
    await edit(dialog().querySelector("textarea")!, "Paid twice");
    await click(named("Do it"));
    expect(got).toEqual(["Paid twice"]);
  });

  test("an optional or missing reason gives undefined", async () => {
    const got: (string | undefined)[] = [];
    await mount(<Host onAction={(r) => got.push(r)} />);
    await click(named("Do it"));
    expect(got).toEqual([undefined]);
  });

  test("blocked shows its reason and refuses the action", async () => {
    let calls = 0;
    await mount(<Host blocked="Another job is running." onAction={() => calls++} />);
    const status = dialog().querySelector('[role="status"]')!;
    expect(status.textContent).toContain("Another job is running.");
    const action = named("Do it");
    expect(action.getAttribute("aria-disabled")).toBe("true");
    expect(action.getAttribute("aria-describedby")).toBeTruthy();
    expect(action.textContent).toBe("Do it");
    await click(action);
    expect(calls).toBe(0);
  });

  test("pending: a second press, Enter and Escape do nothing", async () => {
    let calls = 0;
    let closes = 0;
    let setPending = (_: boolean) => {};
    function Wrap() {
      const [pending, set] = useState(false);
      setPending = set;
      return <Host pending={pending} onAction={() => calls++} onOpenChange={() => closes++} />;
    }
    await mount(<Wrap />);
    await click(named("Do it"));
    expect(calls).toBe(1);
    await act(async () => setPending(true));
    const action = buttons().find((b) => b.getAttribute("aria-busy") === "true")!;
    await click(action);
    await act(async () => dialog().querySelector("form")!.requestSubmit());
    await press(dialog(), { key: "Escape" });
    await click(named("Cancel"));
    await click(dialog().querySelector('[aria-label="Close"]')!);
    expect(calls).toBe(1);
    expect(closes).toBe(0);
  });

  test("destructive gives a danger button", async () => {
    await mount(<Host destructive />);
    expect(named("Do it").className).toContain("bg-danger");
  });

  test("the action is primary without destructive", async () => {
    await mount(<Host />);
    expect(named("Do it").className).toContain("bg-primary");
  });

  test("Enter in the name field runs the action when it matches", async () => {
    let calls = 0;
    await mount(<Host confirmName="Main website" onAction={() => calls++} />);
    const input = field("input");
    await edit(input, "nope");
    await act(async () => input.form!.requestSubmit());
    expect(calls).toBe(0);
    await edit(input, "Main website");
    await act(async () => input.form!.requestSubmit());
    expect(calls).toBe(1);
  });

  test("the dialog does not close itself after the action", async () => {
    let closes = 0;
    await mount(<Host onOpenChange={() => closes++} />);
    await click(named("Do it"));
    expect(closes).toBe(0);
    expect(dialog()).not.toBeNull();
  });

  test("the typed name and the reason start empty at each open", async () => {
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button id="t" onClick={() => setOpen((o) => !o)}>t</button>
          <Host open={open} onOpenChange={setOpen} confirmName="x" reason={{ label: "Why" }} />
        </>
      );
    }
    await mount(<Toggle />);
    await edit(field("input"), "abc");
    await edit(dialog().querySelector("textarea")!, "because");
    await click(document.getElementById("t")!);
    await tick();
    await click(document.getElementById("t")!);
    expect(field("input").value).toBe("");
    expect(dialog().querySelector("textarea")!.value).toBe("");
  });

  test("focus goes back to the element that had it before the open", async () => {
    function Menu() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button id="from" onClick={() => setOpen(true)}>Open</Button>
          <Host open={open} onOpenChange={setOpen} />
        </>
      );
    }
    await mount(<Menu />);
    const from = document.getElementById("from")!;
    from.focus();
    await click(from);
    await tick();
    expect(document.activeElement).toBe(named("Cancel"));
    await click(named("Cancel"));
    await tick();
    await tick();
    expect(document.activeElement).toBe(from);
  });

  test("phone: full screen below 768 px, the action first", async () => {
    await mount(<Host />);
    expect(dialog().className).toContain("max-md:inset-0");
    expect(dialog().className).toContain("max-w-lg");
    expect(named("Do it").parentElement!.className).toContain("max-md:flex-col-reverse");
    expect(named("Do it").parentElement!.parentElement!.className).toContain("sticky");
  });

  test("What happens and the name label are Arabic on an Arabic page", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Host confirmName="الموقع" />
      </PercentProvider>,
    );
    expect(dialog().textContent).toContain("ما الذي سيحدث");
    expect(dialog().textContent).toContain("اكتب الموقع للتأكيد.");
  });
});
