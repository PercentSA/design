import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, ImageField, PercentProvider } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const PNG = (name = "logo.png", bytes = 10) => new File([new Uint8Array(bytes)], name, { type: "image/png" });
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const pick = (file: File) =>
  act(async () => {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput().files = dt.files;
    fileInput().dispatchEvent(new Event("change", { bubbles: true }));
  });
const settle = (run: () => void) =>
  act(async () => {
    run();
    await Promise.resolve();
  });
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent!.startsWith(text));
const preview = () => document.querySelector("img")?.getAttribute("src") ?? null;
const root = () => document.querySelector<HTMLElement>(".logo-field")!;

let changes: (string | null)[] = [];
beforeEach(() => (changes = []));
function Logo({ upload, initial = null, name }: { upload: (file: File) => Promise<string>; initial?: string | null; name?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Field label="Logo">
        <ImageField
          value={value}
          onValueChange={(v) => {
            changes.push(v);
            setValue(v);
          }}
          upload={upload}
          alt="Company logo"
          name={name}
          className="logo-field"
        />
      </Field>
      {/* The app clears the field (a form reset). */}
      <button type="button" onClick={() => setValue(null)}>
        Reset
      </button>
    </>
  );
}

describe("ImageField", () => {
  test("a pick calls upload, shows uploading, then the preview", async () => {
    const job = Promise.withResolvers<string>();
    const upload = mock((_file: File) => job.promise);
    await mount(<Logo upload={upload} initial="https://cdn.example/old.png" />);
    const file = PNG();
    await pick(file);
    expect(upload.mock.calls).toEqual([[file]]);
    expect([root().getAttribute("aria-busy"), root().textContent!.includes("Uploading")]).toEqual(["true", true]);
    // Replace is loading (it keeps the focus, clicks do nothing); Remove is disabled.
    expect([button("Replace image")!.getAttribute("aria-disabled"), button("Remove image")!.disabled, preview()]).toEqual(["true", true, "https://cdn.example/old.png"]);
    await settle(() => job.resolve("https://cdn.example/new.png"));
    expect([preview(), document.querySelector("img")!.alt, root().getAttribute("aria-busy")]).toEqual(["https://cdn.example/new.png", "Company logo", null]);
    expect(changes).toEqual(["https://cdn.example/new.png"]);
    expect([button("Replace image")!.getAttribute("aria-disabled"), button("Remove image")!.disabled]).toEqual([null, false]);
  });

  test("a wrong type or a file over maxSizeMb is refused and upload is not called", async () => {
    const upload = mock(() => Promise.resolve("https://cdn.example/x.png"));
    await mount(<Logo upload={upload} />);
    await pick(new File(["x"], "notes.txt", { type: "text/plain" }));
    expect(document.querySelector('[role="alert"]')!.textContent).toBe("This file type is not accepted.");
    await pick(PNG("big.png", 2_000_001));
    expect(document.querySelector('[role="alert"]')!.textContent).toBe("This file is larger than 2 MB.");
    expect(upload).not.toHaveBeenCalled();
  });

  test("a failed upload keeps the old image and shows the Arabic message", async () => {
    const job = Promise.withResolvers<string>();
    await mount(
      <PercentProvider lang="ar">
        <Logo upload={() => job.promise} initial="https://cdn.example/old.png" />
      </PercentProvider>,
    );
    await pick(PNG());
    expect(root().textContent).toContain("جارٍ الرفع");
    await settle(() => job.reject(new Error("offline")));
    expect([preview(), document.querySelector('[role="alert"]')!.textContent, changes]).toEqual([
      "https://cdn.example/old.png",
      "تعذّر رفع الصورة. حاول مرة أخرى.",
      [],
    ]);
    expect([!!button("استبدال الصورة"), !!button("إزالة الصورة")]).toEqual([true, true]);
  });

  test("remove gives null; a late upload after remove is ignored", async () => {
    const jobs: PromiseWithResolvers<string>[] = [];
    const upload = () => {
      jobs.push(Promise.withResolvers<string>());
      return jobs.at(-1)!.promise;
    };
    await mount(<Logo upload={upload} initial="https://cdn.example/old.png" />);
    // A slow upload, then the app clears the field (a form reset): the late result does not come back.
    await pick(PNG());
    await click(button("Reset")!);
    await settle(() => jobs[0]!.resolve("https://cdn.example/late.png"));
    expect([preview(), changes, root().getAttribute("aria-busy")]).toEqual([null, [], null]);

    await pick(PNG("new.png"));
    await settle(() => jobs[1]!.resolve("https://cdn.example/new.png"));
    await click(button("Remove image")!);
    expect([changes, preview(), document.activeElement]).toEqual([["https://cdn.example/new.png", null], null, fileInput()]);
  });

  test("name posts the URL", () => {
    const out = renderToStaticMarkup(<ImageField value="https://cdn.example/logo.png" onValueChange={() => {}} upload={async () => ""} alt="Logo" name="logo" />);
    expect(out).toContain('<input type="hidden" name="logo" value="https://cdn.example/logo.png"/>');
    expect(out).not.toMatch(/<input[^>]*type="file"[^>]*name=/);
    // Disabled: nothing posts, nothing picks.
    const off = renderToStaticMarkup(<ImageField value="https://cdn.example/logo.png" onValueChange={() => {}} upload={async () => ""} alt="Logo" name="logo" disabled />);
    expect(off.match(/<input type="hidden"[^>]*>/)![0]).toMatch(/^(?=.*name="logo")(?=.*disabled="")/);
    expect(off).toMatch(/<input[^>]*type="file"[^>]*disabled=""/);
    expect(off.match(/<button[^>]*disabled=""/g)).toHaveLength(2);
  });
});
