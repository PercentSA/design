"use client";

// The entry @percentsa/ui/react-hook-form. react-hook-form is an optional peer: only this file imports it.
import type { ReactNode } from "react";
import {
  useController,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { Field } from "./components/field";

/**
 * A react-hook-form field in a <Field>: label, hint, the field's error message and a character counter
 * (`max`). The control from `render` gets its id and aria wiring from Field. Controls with
 * `onValueChange` (PhoneInput, Combobox, DatePicker) take `field.onChange` in `render`.
 * TTransformedValues: a form whose resolver changes the values (a zod schema with coerce or transform).
 */
export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, TTransformedValues = TFieldValues>({
  control,
  name,
  rules,
  render,
  max,
  ...props
}: {
  control: Control<TFieldValues, any, TTransformedValues>;
  name: TName;
  rules?: UseControllerProps<TFieldValues, TName>["rules"];
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  max?: number;
  id?: string;
  className?: string;
  render: (props: { field: ControllerRenderProps<TFieldValues, TName>; fieldState: ControllerFieldState }) => ReactNode;
}) {
  const { field, fieldState } = useController({ control, name, rules });
  return (
    <Field {...props} max={max} count={max != null ? String(field.value ?? "").length : undefined} error={fieldState.error?.message}>
      {render({ field, fieldState })}
    </Field>
  );
}
