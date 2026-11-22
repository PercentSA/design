import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { useState } from "react";
import { PercentProvider, Sidebar, type SidebarSection } from "../src";
import { click, mount, useDom } from "./dom";

useDom();
afterEach(() => localStorage.clear());

const make = (current?: string, hosting: Partial<SidebarSection> = {}): SidebarSection[] => [
  { items: [{ href: "/home", label: "Home", icon: <svg />, current: current === "/home" }] },
  {
    title: "Hosting",
    collapsible: true,
    id: "hosting",
    badge: "2",
    items: [
      { href: "/servers", label: "Servers", icon: <svg />, current: current === "/servers" },
      { href: "/backups", label: "Backups", icon: <svg />, current: current === "/backups" },
    ],
    ...hosting,
  },
  { title: "System", collapsible: true, id: "system", items: [{ href: "/logs", label: "Logs", icon: <svg /> }] },
];
const fold = (el: Element, title = "Hosting") => [...el.querySelectorAll("h2 button")].find((b) => b.textContent!.includes(title))!;
const items = (el: Element, title = "Hosting") => document.getElementById(fold(el, title).getAttribute("aria-controls")!)!;

describe("Sidebar section fold", () => {
  test("a collapsible section has a fold button in its heading; folded unless the current page is inside", async () => {
    const el = await mount(<Sidebar sections={make("/home")} />);
    const b = fold(el);
    expect(b.tagName).toBe("BUTTON");
    expect(b.getAttribute("type")).toBe("button");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(items(el).hasAttribute("hidden")).toBe(true);
    await click(b);
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(items(el).hasAttribute("hidden")).toBe(false);
    const el2 = await mount(<Sidebar sections={make("/servers")} />);
    expect(fold(el2).getAttribute("aria-expanded")).toBe("true");
  });

  test("the fold is kept in the browser under the section id", async () => {
    const el = await mount(<Sidebar sections={make("/home")} />);
    await click(fold(el));
    expect(localStorage.getItem("p-sidebar-section:hosting")).toBe("1");
    document.body.innerHTML = "";
    const el2 = await mount(<Sidebar sections={make("/home")} />);
    expect(fold(el2).getAttribute("aria-expanded")).toBe("true");
    expect(fold(el2, "System").getAttribute("aria-expanded")).toBe("false");
    await click(fold(el2));
    expect(localStorage.getItem("p-sidebar-section:hosting")).toBe("0");
  });

  test("defaultOpen opens it at first; a stored choice wins", async () => {
    const el = await mount(<Sidebar sections={make("/home", { defaultOpen: true })} />);
    expect(fold(el).getAttribute("aria-expanded")).toBe("true");
    localStorage.setItem("p-sidebar-section:hosting", "0");
    const el2 = await mount(<Sidebar sections={make("/home", { defaultOpen: true })} />);
    expect(fold(el2).getAttribute("aria-expanded")).toBe("false");
  });

  test("a page change into a folded section opens it", async () => {
    function App() {
      const [cur, setCur] = useState("/home");
      return (
        <>
          <button id="go" onClick={() => setCur("/backups")} />
          <Sidebar sections={make(cur)} />
        </>
      );
    }
    const el = await mount(<App />);
    expect(fold(el).getAttribute("aria-expanded")).toBe("false");
    await click(el.querySelector("#go")!);
    expect(fold(el).getAttribute("aria-expanded")).toBe("true");
    expect(localStorage.getItem("p-sidebar-section:hosting")).toBeNull();
  });

  test("a move to another page inside a folded section opens it again", async () => {
    function App() {
      const [cur, setCur] = useState("/servers");
      return (
        <>
          <button id="go" onClick={() => setCur("/backups")} />
          <Sidebar sections={make(cur)} />
        </>
      );
    }
    const el = await mount(<App />);
    await click(fold(el));
    expect(fold(el).getAttribute("aria-expanded")).toBe("false");
    localStorage.clear();
    await click(el.querySelector("#go")!);
    expect(fold(el).getAttribute("aria-expanded")).toBe("true");
    expect(localStorage.getItem("p-sidebar-section:hosting")).toBeNull();
  });

  test("a stored 0 with the current page inside gives an open section; an unknown value gives the default", async () => {
    localStorage.setItem("p-sidebar-section:hosting", "0");
    const el = await mount(<Sidebar sections={make("/servers")} />);
    expect(fold(el).getAttribute("aria-expanded")).toBe("true");
    localStorage.setItem("p-sidebar-section:hosting", "yes");
    const el2 = await mount(<Sidebar sections={make("/home")} />);
    expect(fold(el2).getAttribute("aria-expanded")).toBe("false");
  });

  test("a fold made in the expanded sidebar stays after a switch to the rail and back", async () => {
    function App() {
      const [c, setC] = useState(false);
      return (
        <>
          <button id="rail" onClick={() => setC(!c)} />
          <Sidebar sections={make("/home")} collapsed={c} />
        </>
      );
    }
    const el = await mount(<App />);
    await click(fold(el));
    await click(el.querySelector("#rail")!);
    expect(el.querySelector("h2 button")).toBeNull();
    await click(el.querySelector("#rail")!);
    expect(fold(el).getAttribute("aria-expanded")).toBe("true");
  });

  test("the badge shows on the title only while folded", async () => {
    const el = await mount(<Sidebar sections={make("/home")} />);
    expect(fold(el).textContent).toContain("2");
    await click(fold(el));
    expect(fold(el).textContent).not.toContain("2");
  });

  test("the rail does not fold: every item shows and there is no fold button", async () => {
    const el = await mount(<Sidebar sections={make("/home")} collapsed />);
    expect(el.querySelector("h2 button")).toBeNull();
    expect(el.querySelectorAll("li").length).toBe(4);
    expect(el.querySelector("[hidden]")).toBeNull();
    expect(el.querySelector("h2")!.className).toContain("sr-only");
    expect(el.textContent).not.toContain("2");
  });

  test("a storage error keeps the default fold", async () => {
    const get = spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      const el = await mount(<Sidebar sections={make("/home")} />);
      expect(fold(el).getAttribute("aria-expanded")).toBe("false");
      await click(fold(el));
      expect(fold(el).getAttribute("aria-expanded")).toBe("true");
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });

  test("the fold chevron mirrors in RTL", async () => {
    const el = await mount(<PercentProvider lang="ar"><Sidebar sections={make("/home")} /></PercentProvider>);
    expect(fold(el).querySelector("svg")!.getAttribute("class")).toContain("rtl:-scale-x-100");
  });
});

const status = (s: "danger" | "warning", extra: Partial<SidebarSection["items"][number]> = {}): SidebarSection[] => [
  { items: [{ href: "/apps", label: "Apps", icon: <svg />, status: s, statusLabel: "1 app down", ...extra }] },
];
const dot = (el: Element) => el.querySelector("a span[aria-hidden]")!;

describe("Sidebar item status", () => {
  test("status shows a dot and the status label for screen readers", async () => {
    const el = await mount(<Sidebar sections={status("danger")} />);
    expect(el.querySelector("a")!.textContent).toContain("1 app down");
    expect(dot(el).className).toContain("bg-danger");
    expect(dot(el).getAttribute("aria-hidden")).toBe("true");
  });

  test("warning status uses the warning colour", async () => {
    const el = await mount(<Sidebar sections={status("warning")} />);
    expect(dot(el).className).toContain("bg-warning");
  });

  test("a child item takes status too", async () => {
    const sections: SidebarSection[] = [
      { items: [{ href: "/a", label: "Al Noor", children: [{ href: "/a/app", label: "App", status: "danger", statusLabel: "Site down" }] }] },
    ];
    const el = await mount(<Sidebar sections={sections} />);
    const a = el.querySelector('a[href="/a/app"]')!;
    expect(a.textContent).toContain("Site down");
    expect(a.querySelector("span.bg-danger")).not.toBeNull();
  });

  test("in the rail the status dot sits on the icon and the link still names the status", async () => {
    const el = await mount(<Sidebar sections={status("danger", { badge: 3 })} collapsed />);
    expect(el.querySelector("a")!.textContent).toContain("1 app down");
    expect(el.querySelectorAll("a span[aria-hidden]").length).toBe(1);
    expect(dot(el).className).toContain("bg-danger");
    expect(dot(el).className).toContain("absolute");
  });
});
