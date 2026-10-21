import { describe, expect, test } from "bun:test";
import { act } from "react";
import {
  AlertDialog,
  Button,
  ConsentBanner,
  ContextMenu,
  Dialog,
  DropdownMenu,
  HoverCard,
  PercentProvider,
  Popover,
  readConsent,
  Sheet,
  toast,
  Toaster,
  Tooltip,
} from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const body = () => document.body.innerHTML;

describe("dialogs", () => {
  test("Dialog: title, description, close button labelled in the page language", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Dialog open title="تأكيد" description="هل أنت متأكد؟">
          محتوى
        </Dialog>
      </PercentProvider>,
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)!.textContent).toBe("تأكيد");
    expect(dialog.querySelector('[aria-label="إغلاق"]')).not.toBeNull();
    expect(dialog.textContent).toContain("محتوى");
  });
  test("Dialog opens from its trigger", async () => {
    const el = await mount(<Dialog trigger={<Button>Open</Button>} title="Hello">Body</Dialog>);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await click(el.querySelector("button")!);
    expect(document.querySelector('[role="dialog"]')!.textContent).toContain("Body");
  });
  test("AlertDialog: cancel and action, action calls back", async () => {
    let done = false;
    await mount(<AlertDialog open title="Delete project?" action="Delete" destructive onAction={() => (done = true)} />);
    const alert = document.querySelector('[role="alertdialog"]')!;
    expect(alert.textContent).toContain("Cancel");
    const del = [...alert.querySelectorAll("button")].find((b) => b.textContent === "Delete")!;
    expect(del.className).toContain("bg-danger");
    await click(del);
    expect(done).toBe(true);
  });
  test("Sheet slides from the end side and is a dialog", async () => {
    await mount(<Sheet open title="Filters" side="end">x</Sheet>);
    const sheet = document.querySelector('[role="dialog"]')!;
    expect(sheet.getAttribute("data-side")).toBe("end");
    expect(sheet.querySelector('[aria-label="Close"]')).not.toBeNull();
  });
});

describe("floating", () => {
  test("Popover, HoverCard and Tooltip show their content when open", async () => {
    await mount(
      <>
        <Popover open trigger={<button>p</button>}>Popover body</Popover>
        <HoverCard open trigger={<a href="#x">h</a>}>Card body</HoverCard>
        <Tooltip open content="Tip text">
          <button>t</button>
        </Tooltip>
      </>,
    );
    expect(body()).toContain("Popover body");
    expect(body()).toContain("Card body");
    expect(document.querySelector('[role="tooltip"]')!.textContent).toBe("Tip text");
  });
  test("DropdownMenu renders items, separators and calls onSelect", async () => {
    let picked = "";
    await mount(
      <DropdownMenu
        open
        trigger={<button>menu</button>}
        items={[{ label: "Edit", onSelect: () => (picked = "edit") }, "separator", { label: "Delete", danger: true, onSelect: () => (picked = "delete") }]}
      />,
    );
    const items = document.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(2);
    expect(document.querySelector('[role="separator"]')).not.toBeNull();
    await click(items[1]!);
    expect(picked).toBe("delete");
  });
  test("ContextMenu wraps an area", async () => {
    const el = await mount(<ContextMenu items={[{ label: "Copy" }]}><div>area</div></ContextMenu>);
    expect(el.textContent).toBe("area");
  });
});

describe("toast and consent", () => {
  test("toast() shows a message in the Toaster with a labelled close button", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Toaster />
      </PercentProvider>,
    );
    await act(async () => toast({ title: "تم الحفظ", tone: "success" }));
    expect(body()).toContain("تم الحفظ");
    expect(document.querySelector('[aria-label="إغلاق"]')).not.toBeNull();
  });
  test("ConsentBanner: reject is as easy as accept; the choice is stored in a cookie", async () => {
    let choice = "";
    await mount(<ConsentBanner policyHref="/en/privacy" onChange={(c) => (choice = c)} />);
    const region = document.querySelector('[role="region"]')!;
    expect(region.getAttribute("aria-label")).toBe("Cookies");
    const buttons = [...region.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Reject", "Accept"]);
    await click(buttons[0]!);
    expect(choice).toBe("denied");
    expect(document.cookie).toContain("consent=denied");
    expect(document.querySelector('[role="region"]')).toBeNull();
    expect(readConsent("a=1; consent=granted")).toBe("granted");
    expect(readConsent("")).toBeNull();
  });
});
