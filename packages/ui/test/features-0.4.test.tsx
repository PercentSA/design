import { describe, expect, test } from "bun:test";
import { act, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// Direct imports: the package index is being edited by another agent at the same time.
import { PercentProvider } from "../src/provider";
import { AlertDialog, Popover, Tooltip } from "../src/components/overlays";
import { toast, Toaster } from "../src/components/toast";
import { DropdownMenu } from "../src/components/menus";
import { Card } from "../src/components/card";
import { TicketView } from "../src/components/ticket-view";
import { Invoice } from "../src/components/invoice";
import { Kanban } from "../src/components/kanban";
import { click, mount, press, useDom } from "./dom";

useDom();

const html = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const alert = () => document.querySelector('[role="alertdialog"]');
const actionButton = () => [...alert()!.querySelectorAll("button")].find((b) => b.textContent !== "Cancel")!;

describe("AlertDialog async onAction", () => {
  test("pending: stays open, the action shows Loading and runs once; resolve closes", async () => {
    let calls = 0;
    let resolve!: () => void;
    await mount(
      <AlertDialog
        defaultOpen
        title="Delete project?"
        action="Delete"
        onAction={() => {
          calls++;
          return new Promise<void>((r) => (resolve = r));
        }}
      />,
    );
    await click(actionButton());
    expect(alert()).not.toBeNull();
    expect(actionButton().getAttribute("aria-disabled")).toBe("true");
    expect(actionButton().textContent).toContain("Loading");
    await click(actionButton());
    expect(calls).toBe(1);
    await act(async () => resolve());
    expect(alert()).toBeNull();
  });
  test("while pending, Escape and Cancel do nothing; open again after resolve is a fresh dialog", async () => {
    let resolve!: () => void;
    const changes: boolean[] = [];
    await mount(<AlertDialog defaultOpen onOpenChange={(o) => changes.push(o)} title="Delete project?" action="Delete" onAction={() => new Promise<void>((r) => (resolve = r))} />);
    await click(actionButton());
    await press(alert()!, { key: "Escape" });
    expect(alert()).not.toBeNull();
    const cancel = [...alert()!.querySelectorAll("button")].find((b) => b.textContent === "Cancel")!;
    expect(cancel.disabled).toBe(true);
    await click(cancel);
    expect(alert()).not.toBeNull();
    expect(changes).toEqual([]);
    await act(async () => resolve());
    expect(alert()).toBeNull();
    expect(changes).toEqual([false]);
  });
  test("reject: stays open and the action is enabled again", async () => {
    await mount(<AlertDialog defaultOpen title="Delete project?" action="Delete" onAction={() => Promise.reject(new Error("no"))} />);
    await click(actionButton());
    await act(async () => {});
    expect(alert()).not.toBeNull();
    expect(actionButton().hasAttribute("aria-disabled")).toBe(false);
    expect(actionButton().textContent).toBe("Delete");
  });
  test("controlled: resolve reports the close through onOpenChange", async () => {
    const changes: boolean[] = [];
    await mount(<AlertDialog open onOpenChange={(o) => changes.push(o)} title="Delete project?" action="Delete" onAction={() => Promise.resolve()} />);
    await click(actionButton());
    await act(async () => {});
    expect(changes).toEqual([false]);
  });
  test("sync onAction closes at once (as before)", async () => {
    let done = false;
    await mount(<AlertDialog defaultOpen title="Delete project?" action="Delete" onAction={() => void (done = true)} />);
    await click(actionButton());
    expect(done).toBe(true);
    expect(alert()).toBeNull();
  });
});

test("toast action: an Undo button that calls back once and closes the toast", async () => {
  let undone = 0;
  await mount(
    <PercentProvider lang="en">
      <Toaster />
    </PercentProvider>,
  );
  await act(async () => void toast({ title: "Deleted", action: { label: "Undo", onClick: () => undone++ } }));
  const undo = [...document.querySelectorAll("button")].find((b) => b.textContent === "Undo")!;
  expect(undo).toBeDefined();
  await click(undo);
  expect(undone).toBe(1);
  expect(document.body.textContent).not.toContain("Deleted");
});

test("menu href: a link item through the provider link component", async () => {
  const used: string[] = [];
  const Link = (p: ComponentProps<"a">) => {
    used.push(p.href!);
    return <a data-router="" {...p} />;
  };
  await mount(
    <PercentProvider lang="en" link={Link}>
      <DropdownMenu open trigger={<button>menu</button>} items={[{ label: "Settings", href: "/settings" }, { label: "Docs", href: "https://percent.sa", target: "_blank" }]} />
    </PercentProvider>,
  );
  const a = document.querySelector('a[href="/settings"]')!;
  expect(a.getAttribute("role")).toBe("menuitem");
  expect(a.hasAttribute("data-router")).toBe(true);
  expect(a.textContent).toBe("Settings");
  expect(used).toContain("/settings");
  const ext = document.querySelector('a[href="https://percent.sa"]')!;
  expect(ext.getAttribute("target")).toBe("_blank");
  expect(ext.getAttribute("rel")).toBe("noopener noreferrer");
  expect(ext.textContent).toBe("Docs (opens in a new tab)");
});

test("menu href: Enter follows the link through the link component and closes the menu", async () => {
  let clicks = 0;
  const changes: boolean[] = [];
  const Link = ({ onClick, ...p }: ComponentProps<"a">) => (
    <a
      {...p}
      onClick={(e) => {
        clicks++;
        onClick?.(e); // React Router's Link: the given onClick first, then preventDefault and client navigation
        e.preventDefault();
      }}
    />
  );
  await mount(
    <PercentProvider lang="en" link={Link}>
      <DropdownMenu open onOpenChange={(o) => changes.push(o)} trigger={<button>menu</button>} items={[{ label: "Settings", href: "/settings" }]} />
    </PercentProvider>,
  );
  const a = document.querySelector<HTMLAnchorElement>('a[href="/settings"]')!;
  await act(async () => a.focus());
  await press(a, { key: "Enter" });
  expect(clicks).toBe(1);
  expect(changes).toEqual([false]);
});

describe("logical sides", () => {
  const side = () => document.querySelector("[data-side]")?.getAttribute("data-side");
  test.each([
    ["en", "start", "left"],
    ["ar", "start", "right"],
    ["en", "end", "right"],
    ["ar", "end", "left"],
  ] as const)("Tooltip %s side=%s → %s", async (lang, s, physical) => {
    await mount(
      <PercentProvider lang={lang}>
        <Tooltip open side={s} content="Tip">
          <button>t</button>
        </Tooltip>
      </PercentProvider>,
    );
    expect(side()).toBe(physical);
  });
  test("Popover side=end in Arabic → left", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Popover open side="end" trigger={<button>p</button>}>
          body
        </Popover>
      </PercentProvider>,
    );
    expect(side()).toBe("left");
  });
});

describe("heading levels", () => {
  const INVOICE = {
    number: "INV-1",
    issueDate: "2026-02-18",
    seller: { name: "Percent" },
    buyer: { name: "Client" },
    lines: [{ description: "Work", quantity: 1, unitPrice: 100 }],
    notes: "Thanks",
  };
  const ticket = { subject: "Help", id: "T-1", status: "Open", meta: [], messages: [] };
  const board = { columns: [{ id: "a", title: "To do", cards: ["x"] }], getCardId: (c: string) => c, getCardLabel: (c: string) => c, renderCard: (c: string) => c, onMove: () => {} };
  const tags = (out: string) => [...out.matchAll(/<(h[1-6])\b/g)].map((m) => m[1]);

  test("Card: h3 by default, headingLevel sets it", () => {
    expect(tags(html(<Card title="Plan" />))).toEqual(["h3"]);
    expect(tags(html(<Card title="Plan" headingLevel={2} />))).toEqual(["h2"]);
  });
  test("TicketView: h1 by default, headingLevel sets it", () => {
    expect(tags(html(<TicketView {...ticket} />))).toEqual(["h1"]);
    expect(tags(html(<TicketView {...ticket} headingLevel={2} />))).toEqual(["h2"]);
  });
  test("Invoice: h2 with h3 parts by default; headingLevel moves both", () => {
    expect(tags(html(<Invoice type="standard" {...INVOICE} />))).toEqual(["h2", "h3", "h3", "h3"]);
    expect(tags(html(<Invoice type="standard" {...INVOICE} headingLevel={3} />))).toEqual(["h3", "h4", "h4", "h4"]);
  });
  test("Kanban: column titles h3 by default, headingLevel sets them", () => {
    expect(tags(html(<Kanban {...board} />))).toEqual(["h3"]);
    expect(tags(html(<Kanban {...board} headingLevel={2} />))).toEqual(["h2"]);
  });
});
