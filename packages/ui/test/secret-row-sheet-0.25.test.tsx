import { describe, expect, test } from "bun:test";
import { FormSheet, SecretRow } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const button = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;
const submit = () => sheet().querySelector<HTMLButtonElement>('button[type="submit"]')!;

describe("sheet action word", () => {
  test("the sheet button says Set, then Change", async () => {
    await mount(<SecretRow label="API key" canEdit secret={{ set: false }} onSave={async () => {}} />);
    await click(button("Set"));
    expect(submit().textContent).toBe("Set");
  });

  test("the sheet button says Change while the value is set", async () => {
    await mount(<SecretRow label="API key" canEdit secret={{ set: true }} onSave={async () => {}} />);
    await click(button("Change"));
    expect(submit().textContent).toBe("Change");
  });

  test("FormSheet without submitLabel says Save", async () => {
    await mount(
      <FormSheet trigger={<button type="button">Edit</button>} title="Edit" onSubmit={(e) => e.preventDefault()}>
        <input name="a" />
      </FormSheet>,
    );
    await click(button("Edit"));
    expect(submit().textContent).toBe("Save");
  });
});
