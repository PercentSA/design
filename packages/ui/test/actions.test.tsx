import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BackToTop, Button, ButtonGroup, CopyButton, PercentProvider, SegmentedControl, Spinner, Toggle, ToggleGroup } from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("Button", () => {
  test("variants and sizes map to token classes; type is button by default", () => {
    const out = html(<Button>Start</Button>);
    expect(out).toMatch(/^<button type="button"/);
    expect(out).toContain("bg-primary text-primary-fg");
    expect(html(<Button variant="secondary">x</Button>)).toContain("border-line-strong");
    expect(html(<Button variant="danger">x</Button>)).toContain("bg-danger");
    expect(html(<Button type="submit">x</Button>)).toContain('type="submit"');
    expect(html(<Button variant="link">x</Button>)).toContain("text-[13px]");
  });
  test("loading marks the button busy and keeps its width and its label (for screen readers too)", () => {
    const out = html(<Button loading>Send</Button>);
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('opacity-0 inline-flex'.split(" ")[0]);
    expect(out).toContain(">Send<");
  });
  test("icon-only buttons need a label (type error without it)", () => {
    expect(html(<Button iconOnly aria-label="Close">×</Button>)).toContain('aria-label="Close"');
    // @ts-expect-error aria-label is required when iconOnly
    html(<Button iconOnly>×</Button>);
  });
  test("asChild turns a link into a button-looking link", () => {
    expect(html(<Button asChild><a href="/en#contact">Talk to us</a></Button>)).toMatch(/^<a [^>]*href="\/en#contact"/);
  });
  test("ButtonGroup is a labelled group", () => {
    expect(html(<ButtonGroup aria-label="Actions"><Button>a</Button></ButtonGroup>)).toContain('role="group"');
  });
});

describe("toggles", () => {
  test("Toggle exposes aria-pressed", () => {
    expect(html(<Toggle aria-label="Bold" defaultPressed>B</Toggle>)).toContain('aria-pressed="true"');
  });
  test("SegmentedControl is a single choice with the chosen item marked", () => {
    const out = html(
      <SegmentedControl aria-label="Billing" defaultValue="year" options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }]} />,
    );
    expect(out).toContain('role="radio"');
    expect(out).toMatch(/aria-checked="true"[^>]*>Yearly</);
  });
  test("ToggleGroup allows several choices", () => {
    const out = html(<ToggleGroup aria-label="Days" defaultValue={["sun"]} options={[{ value: "sun", label: "Sun" }, { value: "mon", label: "Mon" }]} />);
    expect(out.match(/aria-pressed=/g)).toHaveLength(2);
  });
});

describe("helpers", () => {
  test("CopyButton labels in the page language", () => {
    expect(html(<CopyButton value="SA03…" />)).toContain("Copy");
    expect(ar(<CopyButton value="SA03…" />)).toContain("نسخ");
  });
  test("CopyButton without clipboard access (http, permission denied) fails quietly and does not say Copied", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const real = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const el = document.createElement("div");
    const root = createRoot(el);
    try {
      await act(async () => root.render(<CopyButton value="SA03" />));
      await act(async () => el.querySelector("button")!.click());
      expect(el.textContent).not.toContain("Copied");
    } finally {
      await act(async () => root.unmount());
      if (real) Object.defineProperty(navigator, "clipboard", real);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });
  test("BackToTop works without JavaScript (#top)", () => {
    expect(html(<BackToTop />)).toContain('href="#top"');
    expect(ar(<BackToTop />)).toContain("العودة إلى الأعلى");
  });
  test("Spinner announces loading, in the page language", () => {
    expect(html(<Spinner />)).toContain('role="status"');
    expect(ar(<Spinner />)).toContain("جارٍ التحميل");
  });
});
