import { describe, expect, test } from "bun:test";
import { useEffect, useState } from "react";
import { PhoneInput, Select, type PhoneCountryCode } from "../src";
import { mount, useDom } from "./dom";

useDom();

const OPTIONS = [
  { value: "SA", label: "Saudi Arabia" },
  { value: "QA", label: "Qatar" },
];

// A form that restores a saved choice right after it mounts (a draft in sessionStorage).
// radix-ui before 1.8 sends "" from its hidden native <select> when the value changes before the
// options are mounted; @percentsa/ui needs radix-ui ^1.8.1.
describe("a value restored on mount", () => {
  test("Select never reports a value that is not one of its options", async () => {
    const got: string[] = [];
    function Form() {
      const [v, setV] = useState("SA");
      useEffect(() => setV("QA"), []);
      return (
        <form>
          <Select aria-label="Country" options={OPTIONS} value={v} onValueChange={(n) => (got.push(n), setV(n))} />
        </form>
      );
    }
    const el = await mount(<Form />);
    expect(got).toEqual([]);
    expect(el.querySelector('[role="combobox"]')?.textContent).toContain("Qatar");
  });
  test("PhoneInput keeps the restored country", async () => {
    function Form() {
      const [c, setC] = useState<PhoneCountryCode>("SA");
      useEffect(() => setC("QA"), []);
      return (
        <form>
          <PhoneInput value="" onValueChange={() => {}} country={c} onCountryChange={setC} />
        </form>
      );
    }
    const el = await mount(<Form />);
    expect(el.querySelector('[role="combobox"]')?.textContent).toContain("QA +974");
  });
});
