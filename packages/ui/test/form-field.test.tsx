import { describe, expect, test } from "bun:test";
import { act } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Combobox, Input, Textarea } from "../src";
import { FormField } from "../src/react-hook-form";
import { mount, press, useDom } from "./dom";

useDom();

const labelFor = (el: Element) => document.querySelector(`label[for="${el.id}"]`);
const describedBy = (el: Element) => (el.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent);

describe("FormField", () => {
  test("the control gets the Field id and description", async () => {
    function Profile() {
      const { control } = useForm({ defaultValues: { name: "" } });
      return <FormField control={control} name="name" label="Name" hint="As on your ID" id="name" render={({ field }) => <Input {...field} />} />;
    }
    await mount(<Profile />);
    const input = document.querySelector("input")!;
    expect([input.id, input.name, labelFor(input)?.textContent]).toEqual(["name", "name", "Name"]);
    expect(describedBy(input)).toEqual(["As on your ID"]);
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  test("a failed submit shows the error at the field and sets aria-invalid", async () => {
    let sent = 0;
    function Required() {
      const { control, handleSubmit } = useForm({ defaultValues: { name: "" } });
      return (
        <form onSubmit={handleSubmit(() => void sent++)}>
          <FormField control={control} name="name" label="الاسم" rules={{ required: "مطلوب" }} render={({ field }) => <Input {...field} />} />
        </form>
      );
    }
    await mount(<Required />);
    const input = document.querySelector("input")!;
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(sent).toBe(0);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy(input)).toEqual(["مطلوب"]);
  });

  test("max counts the characters of the value", async () => {
    const setText = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    function Bio() {
      const { control } = useForm({ defaultValues: { bio: "Hello" } });
      return <FormField control={control} name="bio" label="Bio" max={160} render={({ field }) => <Textarea {...field} />} />;
    }
    await mount(<Bio />);
    const area = document.querySelector("textarea")!;
    expect(describedBy(area)).toEqual(["5 of 160 characters"]);
    await act(async () => {
      setText.call(area, "Hello, Riyadh");
      area.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(describedBy(area)).toEqual(["13 of 160 characters"]);
  });

  test("a form whose resolver changes the values takes FormField", async () => {
    function Quantity() {
      const { control } = useForm<{ qty: string }, unknown, { qty: number }>({ defaultValues: { qty: "2" } });
      return <FormField control={control} name="qty" label="Qty" render={({ field }) => <Input {...field} />} />;
    }
    await mount(<Quantity />);
    expect(document.querySelector("input")!.value).toBe("2");
  });

  test("onValueChange controls work through render", async () => {
    const CITIES = [
      { value: "ruh", label: "Riyadh" },
      { value: "jed", label: "Jeddah" },
    ];
    function City() {
      const { control } = useForm({ defaultValues: { city: "" } });
      const city = useWatch({ control, name: "city" });
      return (
        <>
          <FormField
            control={control}
            name="city"
            label="City"
            render={({ field }) => <Combobox options={CITIES} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} name={field.name} />}
          />
          <output>{city}</output>
        </>
      );
    }
    await mount(<City />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    expect(labelFor(input)?.textContent).toBe("City");
    await press(input, { key: "ArrowDown" });
    await press(input, { key: "Enter" });
    expect(document.querySelector("output")!.textContent).toBe("ruh");
  });
});
