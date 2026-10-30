import { afterEach, describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { NationalAddress, PercentProvider, type NationalAddressValue } from "../src";
import { mount, useDom } from "./dom";

useDom();

const FOUND = {
  code: "RQSA6943",
  full: "6943, Abdulaziz Al Nashmi, Al Salam Dist., 14227, RIYADH",
  building: "6943",
  street: "Abdulaziz Al Nashmi",
  additional: null,
  district: "Al Salam Dist.",
  postal: "14227",
  city: "RIYADH",
};

const realFetch = globalThis.fetch;
let calls: { url: string; init?: RequestInit }[] = [];
function mockFetch(status: number, body: unknown) {
  calls = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}
afterEach(() => {
  globalThis.fetch = realFetch;
});

const setText = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
async function type(input: HTMLInputElement, text: string) {
  await act(async () => {
    input.focus();
    setText.call(input, text);
    input.setSelectionRange(text.length, text.length);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Let the lookup resolve.
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

function Form(props: { autoFetch?: boolean; lang?: "ar" | "en"; initial?: NationalAddressValue }) {
  const [value, setValue] = useState<NationalAddressValue>(props.initial ?? {});
  return <NationalAddress value={value} onValueChange={setValue} autoFetch={props.autoFetch} lang={props.lang} />;
}
const input = (el: HTMLElement, part: string) => el.querySelector<HTMLInputElement>(`input[name="address.${part}"]`)!;

describe("NationalAddress autoFetch", () => {
  test("a full short address fills the other parts; null parts keep what was typed", async () => {
    mockFetch(200, FOUND);
    const el = await mount(<Form autoFetch initial={{ additional: "1234" }} />);
    await type(input(el, "shortAddress"), "rqsa6943");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.percent.sa/v1/address/short?code=RQSA6943");
    expect(calls[0]!.init?.credentials).toBe("include");
    expect(input(el, "building").value).toBe("6943");
    expect(input(el, "street").value).toBe("Abdulaziz Al Nashmi");
    expect(input(el, "district").value).toBe("Al Salam Dist.");
    expect(input(el, "city").value).toBe("RIYADH");
    expect(input(el, "postalCode").value).toBe("14227");
    expect(input(el, "additional").value).toBe("1234");
  });

  test("lang is sent with the code", async () => {
    mockFetch(200, FOUND);
    const el = await mount(<Form autoFetch lang="ar" />);
    await type(input(el, "shortAddress"), "RQSA6943");
    expect(calls[0]!.url).toBe("https://api.percent.sa/v1/address/short?code=RQSA6943&lang=ar");
  });

  test("404 shows 'not found' on the short address, in the language", async () => {
    mockFetch(404, { message: "Address not found" });
    const el = await mount(
      <PercentProvider lang="ar">
        <Form autoFetch />
      </PercentProvider>,
    );
    await type(input(el, "shortAddress"), "RRRR2929");
    expect(input(el, "shortAddress").getAttribute("aria-invalid")).toBe("true");
    expect(el.textContent).toContain("لم نجد عنوانًا بهذا العنوان المختصر.");
    expect(input(el, "building").value).toBe("");
    // Editing the code clears the message.
    await type(input(el, "shortAddress"), "RRRR292");
    expect(el.textContent).not.toContain("لم نجد عنوانًا");
  });

  test("no lookup without autoFetch or before the code is complete", async () => {
    mockFetch(200, FOUND);
    const off = await mount(<Form />);
    await type(input(off, "shortAddress"), "RQSA6943");
    const on = await mount(<Form autoFetch />);
    await type(input(on, "shortAddress"), "RQSA694");
    expect(calls).toHaveLength(0);
  });
});
