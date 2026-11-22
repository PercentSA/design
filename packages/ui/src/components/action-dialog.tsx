"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { toWesternDigits } from "../saudi/digits";
import { Button } from "./actions";
import { blockedProps } from "./button-class";
import { BlockedStatus, useFocusReturn } from "./dialog-parts";
import { Field } from "./field";
import { FOCUSABLE } from "./focusable";
import { Input, Textarea } from "./inputs";
import { DescriptionList } from "./list";
import { BACKDROP, CLOSE, PANEL } from "./overlay-classes";

export type ActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** The record the action works on: `value` large, `title`, `meta` small, `facts` as a compact list. */
  subject: { title: ReactNode; meta?: ReactNode; value?: ReactNode; facts?: { term: ReactNode; value: ReactNode }[] };
  notice?: ReactNode;
  /** Choices and fields. The first one gets the first focus. */
  children?: ReactNode;
  /** What the action will do, one line each. `null`: the choice is not made yet, `effectsEmpty` shows. */
  effects: ReactNode[] | null;
  effectsEmpty?: ReactNode;
  reason?: { label: ReactNode; required?: boolean };
  /** The name the person must type before the action runs. End spaces are ignored; case counts. */
  confirmName?: string;
  action: ReactNode;
  destructive?: boolean;
  /** Why the action is refused now. It shows above the buttons (announced). */
  blocked?: string;
  /** The action runs: it shows loading and every close and a second press do nothing. */
  pending?: boolean;
  onAction: (reason?: string) => void;
};


/**
 * Asks before an action that has an effect: the record, the choices, then "What happens" (read aloud when it changes).
 * The action is refused (visible, `aria-disabled`) while `blocked`, while the typed name differs from `confirmName`,
 * or while a required `reason` is empty. The dialog does not close itself after `onAction`: close it when the work is done.
 * The first focus goes to the first choice or field, else to Cancel. Full screen on a phone.
 */
export function ActionDialog(props: ActionDialogProps) {
  const { open, onOpenChange, pending } = props;
  const s = useStrings();
  const focus = useFocusReturn();
  const content = useRef<HTMLDivElement>(null);
  const request = (o: boolean) => pending && !o ? undefined : onOpenChange(o);
  return (
    <RadixDialog.Root open={open} onOpenChange={request}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={BACKDROP} />
        <RadixDialog.Content
          ref={content}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            focus.onOpenAutoFocus();
            const el = content.current;
            const target =
              el?.querySelector<HTMLElement>(`[data-ad-choices] :is(${FOCUSABLE})`) ??
              el?.querySelector<HTMLElement>("[data-ad-reason]") ??
              el?.querySelector<HTMLElement>("[data-ad-name]") ??
              el?.querySelector<HTMLElement>("[data-ad-cancel]");
            target?.focus();
          }}
          onCloseAutoFocus={focus.onCloseAutoFocus}
          className={cn(
            "p-pop fixed z-(--p-z-overlay) flex flex-col overflow-auto",
            "max-md:inset-0 max-md:h-dvh",
            "md:start-1/2 md:top-1/2 md:max-h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-y-1/2 md:rounded-panel ltr:md:-translate-x-1/2 rtl:md:translate-x-1/2",
            PANEL,
          )}
        >
          {/* The form mounts with the content, so the typed name and the reason start empty at each open. */}
          <Body {...props} />
          <RadixDialog.Close disabled={pending} className={CLOSE} aria-label={s.close}>
            <X aria-hidden />
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function Body({ title, subject, notice, children, effects, effectsEmpty, reason, confirmName, action, destructive, blocked, pending, onAction, onOpenChange }: ActionDialogProps) {
  const s = useStrings();
  const reasonId = useId();
  const [typed, setTyped] = useState("");
  const [why, setWhy] = useState("");
  const text = why.trim();
  const refused = !!blocked || (confirmName != null && toWesternDigits(typed).trim() !== toWesternDigits(confirmName)) || (!!reason?.required && !text);
  const shown = effects && effects.length > 0 ? effects : null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (refused || pending) return;
    onAction(reason ? text || undefined : undefined);
  };
  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-1 content-start gap-5 p-6 md:p-8">
        <RadixDialog.Title className="heading pe-10 text-xl">{title}</RadixDialog.Title>
        <div className="grid gap-3 rounded-card border border-line bg-surface p-4">
          {subject.value != null && <div className="heading text-2xl tabular-nums">{subject.value}</div>}
          <div className="grid gap-0.5">
            <div className="font-medium">{subject.title}</div>
            {subject.meta != null && <div className="text-xs text-fg-3">{subject.meta}</div>}
          </div>
          {subject.facts && <DescriptionList layout="columns" density="compact" items={subject.facts.map((f) => ({ term: f.term, details: f.value }))} />}
        </div>
        {notice}
        {children != null && <div data-ad-choices className="grid gap-4">{children}</div>}
        <section aria-live="polite" className="grid gap-2">
          <h3 className="label text-fg-3">{s.whatHappens}</h3>
          {shown ? (
            <ul className="grid list-disc gap-1 ps-5 text-sm text-fg-2">
              {shown.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            effectsEmpty != null && <p className="text-sm text-fg-3">{effectsEmpty}</p>
          )}
        </section>
        {reason && (
          <Field label={reason.label} required={reason.required}>
            <Textarea data-ad-reason value={why} onChange={(e) => setWhy(e.target.value)} />
          </Field>
        )}
        {confirmName != null && (
          <Field label={s.typeToConfirm(confirmName)}>
            <Input data-ad-name value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </Field>
        )}
      </div>
      <div className="sticky bottom-0 grid gap-3 border-t border-line bg-surface-2 px-6 py-4 md:px-8">
        <BlockedStatus id={reasonId}>{blocked && !pending ? blocked : undefined}</BlockedStatus>
        <div className="flex flex-wrap justify-end gap-2 max-md:flex-col-reverse *:max-md:w-full">
          <Button variant="secondary" data-ad-cancel disabled={pending} onClick={() => onOpenChange(false)}>
            {s.cancel}
          </Button>
          <Button
            type="submit"
            variant={destructive ? "danger" : "primary"}
            loading={pending}
            // aria-disabled, not disabled: the button keeps its focus. The reason stays out of its name.
            {...(refused && !pending ? { ...blockedProps(reasonId), "aria-describedby": blocked ? reasonId : undefined } : {})}
          >
            {action}
          </Button>
        </div>
      </div>
    </form>
  );
}
