import { describe, expect, test } from "bun:test";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState, Forbidden, NotFound, PercentProvider, StatusBadge, type StatusTone } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const TONES: StatusTone[] = ["neutral", "info", "success", "warning", "danger"];
const dotClass = (html: string) => html.match(/<span aria-hidden="true" class="([^"]+)"/)?.[1] ?? "";
const ar = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("StatusBadge", () => {
  test.each(TONES)("StatusBadge %s: colour on the dot only", (tone) => {
    const html = renderToStaticMarkup(<StatusBadge tone={tone}>Paid</StatusBadge>);
    expect(dotClass(html)).toContain("rounded-pill");
    expect(html).toContain(">Paid<");
    expect(html).not.toMatch(/text-(danger|warning|live|success)/);
  });
  test("neutral and info differ by shape", () => {
    const neutral = dotClass(renderToStaticMarkup(<StatusBadge>Draft</StatusBadge>));
    const info = dotClass(renderToStaticMarkup(<StatusBadge tone="info">Sent</StatusBadge>));
    expect(neutral).toContain("border");
    expect(neutral).not.toContain("bg-");
    expect(info).toContain("bg-");
    expect(dotClass(renderToStaticMarkup(<StatusBadge tone="success">Paid</StatusBadge>))).toContain("bg-live");
  });
});

describe("page states", () => {
  test("EmptyState error: role alert, retry calls onRetry, Arabic label", async () => {
    let calls = 0;
    const el = await mount(
      <PercentProvider lang="ar">
        <EmptyState tone="error" title="تعذر تحميل الطلبات" onRetry={() => calls++} />
      </PercentProvider>,
    );
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector(".text-danger svg")).not.toBeNull();
    const button = el.querySelector("button")!;
    expect(button.textContent).toBe("حاول مرة أخرى");
    await click(button);
    expect(calls).toBe(1);
  });
  test("EmptyState without tone keeps its markup", () => {
    const html = renderToStaticMarkup(<EmptyState title="No orders yet" />);
    expect(html).not.toContain("role=");
    expect(html).not.toContain("text-danger");
    expect(html).toContain("<svg");
    expect(html).not.toContain("<button");
  });
  test("NotFound: Arabic title and text, back link through the provider link", () => {
    const Link = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar" link={Link}>
        <NotFound back={{ href: "/ar/orders", label: "الطلبات" }} />
      </PercentProvider>,
    );
    expect(html).toContain("غير موجود");
    expect(html).toContain("هذه الصفحة أو هذا السجل غير موجود، أو حُذف.");
    expect(html).toMatch(/<a data-router="" href="\/ar\/orders"[^>]*>الطلبات<\/a>/);
    expect(renderToStaticMarkup(<NotFound />)).toContain("Not found");
  });
  test("Forbidden names the permission in both languages", () => {
    const en = renderToStaticMarkup(<Forbidden permission="Export orders" />);
    expect(en).toContain("No access");
    expect(en).toContain("Ask an administrator for access.");
    expect(en).toContain("Needed permission: Export orders");
    const html = ar(<Forbidden permission="تصدير الطلبات" />);
    expect(html).toContain("لا تملك صلاحية الوصول");
    expect(html).toContain("الصلاحية المطلوبة: تصدير الطلبات");
    expect(renderToStaticMarkup(<Forbidden />)).not.toContain("Needed permission");
  });
});
