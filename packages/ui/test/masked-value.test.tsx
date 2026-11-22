import { describe, expect, test } from "bun:test";
import { act, StrictMode } from "react";
import { ConnectionCard, MaskedValue, PercentProvider } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));
const btn = (name: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.getAttribute("aria-label") === name || b.textContent?.trim() === name)!;
const dialog = () => document.querySelector('[role="alertdialog"]');
const confirm = { title: "Show the password?", description: "This is recorded." };

function deferred() {
  let resolve!: (v: string) => void, reject!: (e: unknown) => void;
  const promise = new Promise<string>((a, b) => ((resolve = a), (reject = b)));
  return { promise, resolve, reject };
}

describe("MaskedValue", () => {
  test("hidden at first: dots and no value in the page; Reveal is named with the label", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={async () => "s3cret"} />);
    expect(el.textContent).toContain("••••••••");
    expect(el.textContent).not.toContain("s3cret");
    expect(el.querySelector('[aria-hidden="true"]:not(svg)')!.textContent).toBe("••••••••");
    expect(btn("Reveal Password")).toBeTruthy();
  });

  test("without canReveal it shows Hidden and no button", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal={false} onReveal={async () => "x"} />);
    expect(el.textContent).toBe("Hidden");
    expect(el.querySelector("button")).toBeNull();
  });

  test("with confirm, Reveal asks first; Show calls onReveal once and shows the value with Copy and Hide", async () => {
    let calls = 0;
    const el = await mount(<MaskedValue label="Password" canReveal confirm={confirm} onReveal={async () => (calls++, "s3cret")} />);
    await click(btn("Reveal Password"));
    expect(calls).toBe(0);
    expect(dialog()!.textContent).toContain("Show the password?");
    await click(btn("Show"));
    await tick();
    expect(calls).toBe(1);
    expect(dialog()).toBeNull();
    expect(el.textContent).toContain("s3cret");
    expect(btn("Copy")).toBeTruthy();
    expect(btn("Hide Password")).toBeTruthy();
  });

  test("without confirm, Reveal calls onReveal at once and shows loading", async () => {
    const d = deferred();
    let calls = 0;
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={() => (calls++, d.promise)} />);
    await click(btn("Reveal Password"));
    expect(calls).toBe(1);
    expect(btn("Reveal Password").getAttribute("aria-busy")).toBe("true");
    await act(async () => d.resolve("s3cret"));
    expect(el.textContent).toContain("s3cret");
  });

  test("a failed reveal keeps the value hidden and the dialog open", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal confirm={confirm} onReveal={() => Promise.reject(new Error("no"))} />);
    await click(btn("Reveal Password"));
    await click(btn("Show"));
    await tick();
    expect(dialog()).not.toBeNull();
    expect(el.textContent).toContain("••••••••");
    await click(btn("Cancel"));
    expect(dialog()).toBeNull();
  });

  test("a failed reveal without confirm gives no unhandled rejection and stays hidden", async () => {
    const seen: unknown[] = [];
    const on = (e: unknown) => seen.push(e);
    process.on("unhandledRejection", on);
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={() => Promise.reject(new Error("no"))} />);
    await click(btn("Reveal Password"));
    await tick();
    await new Promise((r) => setTimeout(r, 10));
    process.off("unhandledRejection", on);
    expect(seen).toHaveLength(0);
    expect(el.textContent).toContain("••••••••");
    expect(btn("Reveal Password").getAttribute("aria-busy")).toBeNull();
  });

  test("after a reveal the focus is on Hide; Hide removes the value and puts the focus on Reveal", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={async () => "s3cret"} />);
    await click(btn("Reveal Password"));
    await tick();
    expect(document.activeElement).toBe(btn("Hide Password"));
    await click(btn("Hide Password"));
    expect(el.textContent).not.toContain("s3cret");
    expect(document.activeElement).toBe(btn("Reveal Password"));
  });

  test("with confirm: after Show the focus is on Hide; after Hide on Reveal", async () => {
    await mount(<MaskedValue label="Password" canReveal confirm={confirm} onReveal={async () => "s3cret"} />);
    await click(btn("Reveal Password"));
    await click(btn("Show"));
    await tick();
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(document.activeElement).toBe(btn("Hide Password"));
    await click(btn("Hide Password"));
    expect(document.activeElement).toBe(btn("Reveal Password"));
  });

  test("in StrictMode a mount does not move the focus", async () => {
    await mount(
      <StrictMode>
        <input id="other" />
        <MaskedValue label="Password" canReveal onReveal={async () => "x"} />
      </StrictMode>,
    );
    expect(document.activeElement).not.toBe(btn("Reveal Password"));
  });

  test("an onReveal that throws at once leaves the button usable and the value hidden", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={() => { throw new Error("no"); }} />);
    await click(btn("Reveal Password"));
    await tick();
    expect(btn("Reveal Password").getAttribute("aria-busy")).toBeNull();
    expect(el.textContent).toContain("••••••••");
  });

  test("the value is in no attribute", async () => {
    const el = await mount(<MaskedValue label="Password" canReveal onReveal={async () => "s3cret"} />);
    await click(btn("Reveal Password"));
    await tick();
    expect(el.innerHTML.replace(/>s3cret</g, "><")).not.toContain("s3cret");
  });

  test("the buttons have Arabic names", async () => {
    await mount(
      <PercentProvider lang="ar">
        <MaskedValue label="كلمة المرور" canReveal onReveal={async () => "x"} />
      </PercentProvider>,
    );
    expect(btn("إظهار كلمة المرور")).toBeTruthy();
    await click(btn("إظهار كلمة المرور"));
    await tick();
    expect(btn("إخفاء كلمة المرور")).toBeTruthy();
  });
});

describe("ConnectionCard", () => {
  test("rows show term and value; copy adds a copy button and mono text", async () => {
    const el = await mount(<ConnectionCard title="Connect" rows={[{ term: "Port", value: "5432" }, { term: "Host", copy: "db.example.com" }]} />);
    expect(el.querySelector("h2")!.textContent).toBe("Connect");
    const dts = [...el.querySelectorAll("dt")].map((d) => d.textContent);
    expect(dts).toEqual(["Port", "Host"]);
    const dds = el.querySelectorAll("dd");
    expect(dds[0]!.textContent).toBe("5432");
    expect(dds[0]!.querySelector("button")).toBeNull();
    expect(dds[1]!.querySelector(".font-mono")!.textContent).toBe("db.example.com");
    expect(dds[1]!.querySelector("button")).not.toBeNull();
  });

  test("a masked row uses MaskedValue", async () => {
    const el = await mount(<ConnectionCard title="Connect" rows={[{ term: "Password", masked: { label: "Password", canReveal: true, onReveal: async () => "x" } }]} />);
    expect(btn("Reveal Password")).toBeTruthy();
    expect(el.querySelector("dd")!.textContent).toContain("••••••••");
  });

  test("action shows in the card header", async () => {
    const el = await mount(<ConnectionCard title="Connect" action={<button>Rotate</button>} rows={[]} />);
    expect(el.querySelector("h2")!.parentElement!.parentElement!.textContent).toContain("Rotate");
  });

  test("a long value breaks", async () => {
    const el = await mount(<ConnectionCard title="Connect" rows={[{ term: "Command", copy: "psql ".padEnd(300, "x") }]} />);
    const mono = el.querySelector(".font-mono")!;
    expect(mono.className).toContain("break-all");
    expect(mono.className).toContain("min-w-0");
  });
});
