"use client";

// The entry @percentsa/ui/react-hook-form. react-hook-form is an optional peer: only this file imports it.
import { useId, type ReactNode } from "react";
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
import { SettingsRow } from "./components/settings";

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

/**
 * A react-hook-form field in a <SettingsRow>: label and description at the start, the control at the end, the field's error
 * message under the control, and the ids and aria wiring from the row. Use it in a <SettingsSection>.
 */
export function FormSettingsRow<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, TTransformedValues = TFieldValues>({
  control,
  name,
  rules,
  render,
  id,
  group,
  ...props
}: {
  control: Control<TFieldValues, any, TTransformedValues>;
  name: TName;
  rules?: UseControllerProps<TFieldValues, TName>["rules"];
  label: ReactNode;
  description?: ReactNode;
  /** For controls with their own label (Switch, Checkbox): the row is a group named by the label and the error is in its description. */
  group?: boolean;
  required?: boolean;
  optional?: boolean;
  id?: string;
  className?: string;
  render: (props: { field: ControllerRenderProps<TFieldValues, TName>; fieldState: ControllerFieldState }) => ReactNode;
}) {
  const auto = useId();
  const { field, fieldState } = useController({ control, name, rules });
  return <SettingsRow {...props} controlId={group ? undefined : (id ?? auto)} error={fieldState.error?.message} control={render({ field, fieldState })} />;
}
