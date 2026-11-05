import { describe, expect, mock, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Field, FormSheet, Input, PercentProvider, RecordSection } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

// Radix gives focus back after a 0 ms timer.
const focusSettles = () => act(() => new Promise<void>((r) => setTimeout(r, 10)));
const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');
const alert = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;
const submitButton = () => sheet()!.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const unloadPrevented = () => {
  const e = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
};
// Enter in a text field: the browser clicks the form's default button (its first submit button).
const enter = async (input: HTMLInputElement) => {
  await press(input, { key: "Enter" });
  await click(input.form!.querySelector('button[type="submit"]')!);
};

function Edit({ dirty, pending, label = "Edit", onOpenChange }: { dirty?: boolean; pending?: boolean; label?: string; onOpenChange?: (open: boolean) => void }) {
  return (
    <FormSheet trigger={<Button>{label}</Button>} title="Edit customer" dirty={dirty} pending={pending} onOpenChange={onOpenChange} onSubmit={(e) => e.preventDefault()}>
      <Field label="Name">
        <Input name="name" defaultValue="Sara" />
      </Field>
    </FormSheet>
  );
}

describe("FormSheet", () => {
  test("Enter in a field submits; the submit button shows loading while pending", async () => {
    let submits = 0;
    function Saving() {
      const [pending, setPending] = useState(false);
      return (
        <FormSheet
          trigger={<Button>Edit</Button>}
          title="Edit customer"
          pending={pending}
          onSubmit={(e) => {
            e.preventDefault();
            submits++;
            setPending(true);
          }}
        >
          <Field label="Name">
            <Input name="name" defaultValue="Sara" />
          </Field>
        </FormSheet>
      );
    }
    await mount(<Saving />);
    await click(button("Edit"));
    const input = sheet()!.querySelector("input")!;
    expect(submitButton().textContent).toBe("Save");
    await enter(input);
    expect([submits, submitButton().getAttribute("aria-busy")]).toEqual([1, "true"]);
    // The sheet stays open: the app closes it when the save succeeds. A second Enter while saving sends nothing.
    await enter(input);
    expect([submits, !!sheet()]).toEqual([1, true]);
  });

  test("a clean form closes at once", async () => {
    await mount(<Edit />);
    await click(button("Edit"));
    await press(sheet()!, { key: "Escape" });
    expect([sheet(), alert()]).toEqual([null, null]);
    await click(button("Edit"));
    await click(button("Cancel"));
    expect([sheet(), alert()]).toEqual([null, null]);
  });

  test("a dirty form asks first on Escape and on Cancel; Discard closes, Keep editing stays", async () => {
    const onOpenChange = mock();
    await mount(<Edit dirty onOpenChange={onOpenChange} />);
    await click(button("Edit"));
    await press(sheet()!, { key: "Escape" });
    expect([!!sheet(), alert()?.textContent]).toEqual([true, expect.stringContaining("Discard your changes?")]);
    expect(alert()!.textContent).toContain("The changes you made are not saved.");
    await click(button("Keep editing"));
    await focusSettles();
    expect([!!sheet(), alert(), sheet()!.contains(document.activeElement)]).toEqual([true, null, true]);
    await click(button("Cancel"));
    expect(alert()).not.toBeNull();
    await click(button("Discard"));
    await focusSettles();
    expect([sheet(), alert(), document.activeElement]).toEqual([null, null, button("Edit")]);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("pending: Escape does not close", async () => {
    await mount(<Edit dirty pending />);
    await click(button("Edit"));
    await press(sheet()!, { key: "Escape" });
    await click(sheet()!.querySelector('button[aria-label="Close"]')!);
    expect([!!sheet(), alert()]).toEqual([true, null]);
  });

  test("beforeunload is prevented only while open and dirty", async () => {
    await mount(
      <>
        <Edit dirty />
        <Edit label="Edit clean" />
      </>,
    );
    expect(unloadPrevented()).toBe(false);
    await click(button("Edit"));
    expect(unloadPrevented()).toBe(true);
    await press(sheet()!, { key: "Escape" });
    await click(button("Discard"));
    expect(unloadPrevented()).toBe(false);
    await click(button("Edit clean"));
    expect([!!sheet(), unloadPrevented()]).toEqual([true, false]);
  });

  test("Arabic strings حفظ and تجاهل التغييرات؟", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Edit dirty />
      </PercentProvider>,
    );
    await click(button("Edit"));
    expect([submitButton().textContent, !!button("إلغاء")]).toEqual(["حفظ", true]);
    await act(async () => button("إلغاء").click());
    expect(alert()!.textContent).toContain("تجاهل التغييرات؟");
    expect(alert()!.textContent).toContain("التغييرات التي أجريتها لم تُحفظ.");
    expect([!!button("تجاهل"), !!button("متابعة التعديل")]).toEqual([true, true]);
  });
});

describe("RecordSection", () => {
  test("RecordSection: empty details show غير محدد, action in the header, h2", () => {
    const out = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <RecordSection
          title="العميل"
          action={<Button>تعديل</Button>}
          items={[
            { term: "الاسم", details: "سارة" },
            { term: "البريد", details: "" },
            { term: "الجوال", details: null },
            { term: "المدينة", details: undefined },
            { term: "الطلبات", details: 0 },
          ]}
        />
      </PercentProvider>,
    );
    expect(out).toMatch(/<h2[^>]*>العميل<\/h2>/);
    expect(out.match(/<dd[^>]*><span class="text-fg-3">غير محدد<\/span><\/dd>/g)).toHaveLength(3);
    expect(out).toMatch(/<dd[^>]*>0<\/dd>/);
    expect(out.indexOf("تعديل")).toBeLessThan(out.indexOf("<dl"));
    expect(renderToStaticMarkup(<RecordSection title="Customer" headingLevel={3} items={[]} />)).toContain("<h3");
  });
});
