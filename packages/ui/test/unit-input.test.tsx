// UnitInput: a number with its unit (0.21.0).
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { UnitInput } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

const UNITS = [
  { value: "s", label: "seconds" },
  { value: "min", label: "minutes" },
];

function Box({ calls }: { calls: [number | null, string][] }) {
  const [value, setValue] = useState<number | null>(null);
  const [unit, setUnit] = useState("s");
  return (
    <UnitInput
      aria-label="Timeout"
      unitLabel="Timeout unit"
      units={UNITS}
      value={value}
      unit={unit}
      onValueChange={(v, u) => {
        calls.push([v, u]);
        setValue(v);
        setUnit(u);
      }}
    />
  );
}

describe("UnitInput", () => {
  test("typing a number and choosing a unit reports both; clearing reports null with the unit", async () => {
    const calls: [number | null, string][] = [];
    const el = await mount(<Box calls={calls} />);
    const input = el.querySelector<HTMLInputElement>('input[aria-label="Timeout"]')!;
    await type(input, "10");
    expect(calls.at(-1)).toEqual([10, "s"]);
    const select = el.querySelector('[role="combobox"]')!;
    expect(select.getAttribute("aria-label")).toBe("Timeout unit");
    await press(select, { key: "ArrowDown" });
    const min = [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent === "minutes")!;
    await click(min);
    expect(calls.at(-1)).toEqual([10, "min"]);
    await type(input, "");
    expect(calls.at(-1)).toEqual([null, "min"]);
  });
});
