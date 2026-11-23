import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { Alert, Button, ConnectionCard, CopyButton, MaskedValue, PercentProvider, TimeText } from "../src";
import { formatDateTime, formatRelative } from "../src";
import { click, mount, removeMatchMedia, stubMatchMedia, useDom } from "./dom";

useDom();

const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));
const btn = (name: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.getAttribute("aria-label") === name || b.textContent?.trim() === name)!;
const now = new Date("2026-09-27T12:45:00Z");
const at = (iso: string) => new Date(iso);

function withClipboard() {
  const own = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } });
  return () => (own ? Object.defineProperty(navigator, "clipboard", own) : delete (navigator as { clipboard?: unknown }).clipboard);
}

describe("CopyButton label", () => {
  test("icon-only: the label names the button; after a copy it reads Copied", async () => {
    const restore = withClipboard();
    try {
      await mount(<CopyButton value="x" iconOnly label="Copy From apps" />);
      await click(btn("Copy From apps"));
      await tick();
      expect(btn("Copied")).toBeTruthy();
    } finally {
      restore();
    }
  });
  test("with text: the label is the visible text", async () => {
    const el = await mount(<CopyButton value="x" label="Copy command" />);
    expect(el.querySelector("button")!.textContent).toBe("Copy command");
  });
  test("without label: Copy, as before", async () => {
    const el = await mount(<CopyButton value="x" />);
    expect(el.querySelector("button")!.textContent).toBe("Copy");
    const icon = await mount(<CopyButton value="x" iconOnly />);
    expect(icon.querySelector("button")!.getAttribute("aria-label")).toBe("Copy");
  });
  test("ConnectionCard copyLabel reaches the button; without it Copy", async () => {
    const el = await mount(
      <ConnectionCard title="Connect" rows={[{ term: "Host", copy: "203.0.113.10", copyLabel: "Copy host" }, { term: "User", copy: "app_user" }]} />,
    );
    const labels = [...el.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"));
    expect(labels).toEqual(["Copy host", "Copy"]);
  });
});

describe("blocked Button joins describedby", () => {
  test("both ids, the caller's first", async () => {
    const el = await mount(<Button blocked="Not now" aria-describedby="hint-1">Save</Button>);
    const b = el.querySelector("button")!;
    const reason = el.querySelector("span[hidden]")!.id;
    expect(b.getAttribute("aria-describedby")).toBe(`hint-1 ${reason}`);
  });
  test("without a caller id: the reason only, as before", async () => {
    const el = await mount(<Button blocked="Not now">Save</Button>);
    expect(el.querySelector("button")!.getAttribute("aria-describedby")).toBe(el.querySelector("span[hidden]")!.id);
  });
});

describe("MaskedValue controlled open", () => {
  const confirm = { title: "Show the password?", action: "Show the value" };
  test("open shows the confirm with the action label; after it the value shows, focus on Hide, onOpenChange(false)", async () => {
    const calls: boolean[] = [];
    function Host() {
      const [open, setOpen] = useState(true);
      return <MaskedValue label="Password" canReveal confirm={confirm} open={open} onOpenChange={(o) => (calls.push(o), setOpen(o))} onReveal={async () => "s3cret"} />;
    }
    await mount(<Host />);
    expect(document.querySelector('[role="alertdialog"]')).toBeTruthy();
    await click(btn("Show the value"));
    await tick();
    await tick();
    expect(document.body.textContent).toContain("s3cret");
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(document.activeElement).toBe(btn("Hide Password"));
    expect(calls.at(-1)).toBe(false);
  });
  test("open={false} keeps the dialog closed; Reveal asks and calls onOpenChange(true)", async () => {
    const calls: boolean[] = [];
    await mount(<MaskedValue label="Password" canReveal confirm={confirm} open={false} onOpenChange={(o) => calls.push(o)} onReveal={async () => "x"} />);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    await click(btn("Reveal Password"));
    expect(calls).toEqual([true]);
  });
  test("without open: as before (own state, action Show)", async () => {
    await mount(<MaskedValue label="Password" canReveal confirm={{ title: "Show it?" }} onReveal={async () => "s3cret"} />);
    await click(btn("Reveal Password"));
    expect(document.querySelector('[role="alertdialog"]')).toBeTruthy();
    await click(btn("Show"));
    await tick();
    expect(document.body.textContent).toContain("s3cret");
  });
});

describe("hourCycle", () => {
  const v = "2026-09-27T12:05:00Z"; // 15:05 in Riyadh
  test("formatDateTime h23: 15:05 in English and Arabic; default stays 12-hour", () => {
    expect(formatDateTime(v, { now, hourCycle: "h23" })).toBe("15:05");
    expect(formatDateTime(v, { now, lang: "ar", hourCycle: "h23" })).toBe("15:05");
    expect(formatDateTime(v, { now, hourCycle: "h23", style: "full" })).toBe("Sunday 27 September 2026, 15:05:00");
    expect(formatDateTime(v, { now })).toBe("3:05 PM");
    expect(formatDateTime(v, { now, lang: "ar" })).toBe("3:05 م");
  });
  test("TimeText: prop, provider, prop wins over provider, none = as before", async () => {
    const text = async (node: React.ReactNode) => (await mount(node)).querySelector("time")!.textContent;
    expect(await text(<TimeText value={v} now={now} hourCycle="h23" />)).toBe("15:05");
    expect(await text(<PercentProvider lang="ar"><TimeText value={v} now={now} hourCycle="h23" /></PercentProvider>)).toBe("15:05");
    expect(await text(<PercentProvider lang="en" hourCycle="h23"><TimeText value={v} now={now} /></PercentProvider>)).toBe("15:05");
    expect(await text(<PercentProvider lang="en" hourCycle="h23"><TimeText value={v} now={now} hourCycle="h12" /></PercentProvider>)).toBe("3:05 PM");
    expect(await text(<TimeText value={v} now={now} />)).toBe("3:05 PM");
  });
});

describe("agoForm", () => {
  const ago = (s: number, lang: "en" | "ar", form?: "long" | "short") => formatRelative(new Date(now.getTime() - s * 1000), { lang, now, form });
  test("formatRelative short: minutes as min; the rest and Arabic do not change", () => {
    expect([60, 300].map((s) => ago(s, "en", "short"))).toEqual(["1 min ago", "5 min ago"]);
    expect([10, 7200, 86_400, 5_184_000].map((s) => ago(s, "en", "short"))).toEqual(["now", "2 hours ago", "yesterday", "2 months ago"]);
    expect(ago(300, "ar", "short")).toBe(ago(300, "ar"));
    expect(ago(300, "en")).toBe("5 minutes ago");
  });
  test("TimeText: prop, provider, none = as before", async () => {
    const t5 = at("2026-09-27T12:40:00Z");
    const text = async (node: React.ReactNode) => (await mount(node)).querySelector("time")!.textContent;
    expect(await text(<TimeText value={t5} ago now={now} agoForm="short" />)).toBe("5 min ago");
    expect(await text(<TimeText value={at("2026-09-27T10:45:00Z")} ago now={now} agoForm="short" />)).toBe("2 hours ago");
    expect(await text(<PercentProvider lang="en" agoForm="short"><TimeText value={t5} ago now={now} /></PercentProvider>)).toBe("5 min ago");
    expect(await text(<PercentProvider lang="en" agoForm="short"><TimeText value={t5} ago now={now} agoForm="long" /></PercentProvider>)).toBe("5 minutes ago");
    expect(await text(<TimeText value={t5} ago now={now} />)).toBe("5 minutes ago");
  });
});

describe("Alert collapsible", () => {
  const alert = (collapsible?: boolean) => (
    <Alert tone="warning" title="Backup late" collapsible={collapsible} action={<button>Retry</button>}>
      The last run failed.
    </Alert>
  );
  test("on a phone: the body is hidden until Show; Hide closes it", async () => {
    stubMatchMedia(true);
    const el = await mount(alert(true));
    expect(el.textContent).toContain("Backup late");
    expect(el.textContent).not.toContain("The last run failed.");
    expect(el.textContent).not.toContain("Retry");
    const b = btn("Show");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.hasAttribute("aria-controls")).toBe(false);
    await click(b);
    expect(el.textContent).toContain("The last run failed.");
    expect(btn("Hide").getAttribute("aria-expanded")).toBe("true");
    expect(el.querySelector("#" + btn("Hide").getAttribute("aria-controls"))!.textContent).toContain("Retry");
    await click(btn("Hide"));
    expect(el.textContent).not.toContain("The last run failed.");
  });
  test("from 768 px: the full alert, no button", async () => {
    stubMatchMedia(false);
    const el = await mount(alert(true));
    expect(el.textContent).toContain("The last run failed.");
    expect(el.querySelector("button")!.textContent).toBe("Retry");
  });
  test("the phone rule is the max-md width", async () => {
    let asked = "";
    stubMatchMedia(false);
    const stub = globalThis.matchMedia;
    globalThis.matchMedia = ((q: string) => ((asked = q), stub(q))) as typeof matchMedia;
    await mount(alert(true));
    expect(asked).toBe("(width < 48rem)");
  });
  test("without matchMedia: the full alert", async () => {
    removeMatchMedia();
    const el = await mount(alert(true));
    expect(el.textContent).toContain("The last run failed.");
  });
  test("without collapsible: as before, matchMedia is not called", async () => {
    stubMatchMedia(true);
    globalThis.matchMedia = (() => {
      throw new Error("matchMedia called");
    }) as unknown as typeof matchMedia;
    const el = await mount(alert());
    expect(el.textContent).toContain("The last run failed.");
    expect(btn("Show")).toBeUndefined();
  });
});
