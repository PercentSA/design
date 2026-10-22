import { describe, expect, test } from "bun:test";
import { act, useState, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Breadcrumbs, DataTable, DropdownMenu, PercentProvider, Sidebar, useLinkComponent, usePendingHref, type LinkComponent } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

// Like a router link: runs the app's onClick, then navigates on the client (no page load in the test DOM).
const RouterLink = ({ onClick, ...p }: ComponentProps<"a">) => (
  <a
    {...p}
    onClick={(e) => {
      onClick?.(e);
      if (!e.defaultPrevented) e.preventDefault();
    }}
  />
);

const sidebar = <Sidebar sections={[{ items: [{ href: "/customers", label: "Customers" }, { href: "/orders", label: "Orders", current: true }] }]} />;
const app = (location: string | undefined, node: ReactNode) => (
  <PercentProvider lang="en" link={RouterLink} location={location}>
    {node}
  </PercentProvider>
);

const pending = (el: ParentNode) => [...el.querySelectorAll("[data-pending]")].map((a) => a.getAttribute("href"));
const clickWith = (el: Element, init: MouseEventInit) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
  });

describe("link pending state", () => {
  test("a plain click marks the link pending at once; a new location clears it", async () => {
    let go = (_: string) => {};
    function Router() {
      const [location, setLocation] = useState("/orders");
      go = setLocation;
      return app(location, sidebar);
    }
    const el = await mount(<Router />);
    const customers = el.querySelector('a[href="/customers"]')!;
    await click(customers);
    expect(pending(el)).toEqual(["/customers"]);
    expect(customers.getAttribute("aria-busy")).toBe("true");
    // The router reports the new page.
    await act(async () => go("/customers"));
    expect(pending(el)).toEqual([]);
    expect(customers.hasAttribute("aria-busy")).toBe(false);
    // Back on the first page, the old click does not count again.
    await act(async () => go("/orders"));
    expect(pending(el)).toEqual([]);
  });

  test("no pending state for clicks that do not navigate here", async () => {
    function Links() {
      const L = useLinkComponent();
      return (
        <>
          <L href="/a">a</L>
          <L href="/new-tab" target="_blank">
            b
          </L>
          <L href="/orders">here</L>
          <L href="/orders#total">here, a part</L>
          <L href="#x">part</L>
          <L href="/file.csv" download>
            file
          </L>
          <L href="/stopped" onClick={(e) => e.preventDefault()}>
            stopped
          </L>
        </>
      );
    }
    const el = await mount(app("/orders", <Links />));
    const a = el.querySelector('a[href="/a"]')!;
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) await clickWith(a, init);
    for (const href of ["/new-tab", "/orders", "/orders#total", "#x", "/file.csv", "/stopped"]) await click(el.querySelector(`a[href="${href}"]`)!);
    expect(pending(el)).toEqual([]);
  });

  test("without location the link component is the app's own", () => {
    let got: LinkComponent | "a" | undefined;
    const Probe = () => {
      got = useLinkComponent();
      return null;
    };
    renderToStaticMarkup(app(undefined, <Probe />));
    expect(got).toBe(RouterLink);
    renderToStaticMarkup(<PercentProvider lang="en"><Probe /></PercentProvider>);
    expect(got).toBe("a");
    renderToStaticMarkup(app("/orders", <Probe />));
    expect(got).not.toBe(RouterLink);
  });

  test("links keep their DOM node when the pending state changes", async () => {
    const el = await mount(app("/orders", sidebar));
    const before = [...el.querySelectorAll("a")];
    await click(before[0]!);
    expect(pending(el)).toEqual(["/customers"]);
    expect([...el.querySelectorAll("a")]).toEqual(before);
  });

  test("DataTable row links, menu link items and Breadcrumbs get the pending state", async () => {
    let href = null as string | null;
    const Probe = () => {
      href = usePendingHref();
      return null;
    };
    const el = await mount(
      app(
        "/orders",
        <>
          <Probe />
          <DataTable columns={[{ key: "name", header: "Invoice" }]} rows={[{ id: "a", name: "INV-1" }]} getRowId={(r) => r.id} caption="Invoices" rowHref={(r) => `/invoices/${r.id}`} />
          <Breadcrumbs items={[{ href: "/home", label: "Home" }, { label: "Orders" }]} />
          <DropdownMenu trigger={<button type="button">Open</button>} items={[{ label: "Customers", href: "/customers" }]} />
        </>,
      ),
    );
    await click(el.querySelector('a[href="/invoices/a"]')!);
    expect(pending(el)).toEqual(["/invoices/a"]);
    await click(el.querySelector('a[href="/home"]')!);
    expect(pending(el)).toEqual(["/home"]);
    const trigger = el.querySelector("button[aria-haspopup]")!;
    await click(trigger);
    await press(trigger, { key: "Enter" });
    await click(document.querySelector('[role="menuitem"][href="/customers"]')!);
    expect(href).toBe("/customers");
  });
});
