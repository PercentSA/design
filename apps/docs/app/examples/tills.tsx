import { useState } from "react";
import { CircleHelp, Clock, Pause, Power, ReceiptText, Wallet } from "lucide-react";
import { ActionBar, type ActionBarItem, AppShell, Button, Heading, Keypad, Money, MoneyInput, Stack, Text, parseAmount } from "@percentsa/ui";
import { useT } from "~/lib/t";

/** The bottom bar of a till: equal tiles with the key hint, a danger item after a separator. The app binds the F keys. */
export function ActionBarExample() {
  const t = useT();
  const [last, setLast] = useState<string>();
  const pick = (name: string) => () => setLast(name);
  const items: ActionBarItem[] = [
    { id: "help", label: t("Help", "مساعدة"), icon: <CircleHelp aria-hidden />, keyHint: "F1", onSelect: pick(t("Help", "مساعدة")) },
    { id: "orders", label: t("Orders", "الطلبات"), icon: <ReceiptText aria-hidden />, keyHint: "F2", onSelect: pick(t("Orders", "الطلبات")) },
    { id: "holds", label: t("Held carts", "السلال المعلقة"), icon: <Pause aria-hidden />, keyHint: "F7", onSelect: pick(t("Held carts", "السلال المعلقة")) },
    { id: "cash", label: t("Cash", "النقد"), icon: <Wallet aria-hidden />, keyHint: "F8", onSelect: pick(t("Cash", "النقد")) },
    { id: "history", label: t("History", "السجل"), icon: <Clock aria-hidden />, keyHint: "F9", disabled: true, onSelect: pick(t("History", "السجل")) },
    { id: "close", label: t("Close shift", "إغلاق الوردية"), icon: <Power aria-hidden />, tone: "danger", group: "end", onSelect: pick(t("Close shift", "إغلاق الوردية")) },
  ];
  return (
    <Stack gap={3} className="w-full">
      <ActionBar label={t("Till actions", "إجراءات الصندوق")} items={items} />
      <Text size="sm" tone="muted" aria-live="polite">
        {last ? t(`Chosen: ${last}`, `المختار: ${last}`) : t("Choose an action.", "اختر إجراءً.")}
      </Text>
    </Stack>
  );
}

/** In a narrow box a tile would be under 5rem wide: the last main items move into the More menu; the end item stays. */
export function ActionBarOverflowExample() {
  const t = useT();
  const items: ActionBarItem[] = [
    { id: "help", label: t("Help", "مساعدة"), icon: <CircleHelp aria-hidden />, keyHint: "F1", onSelect: () => {} },
    { id: "orders", label: t("Orders", "الطلبات"), icon: <ReceiptText aria-hidden />, keyHint: "F2", onSelect: () => {} },
    { id: "holds", label: t("Held carts", "السلال المعلقة"), icon: <Pause aria-hidden />, keyHint: "F7", onSelect: () => {} },
    { id: "cash", label: t("Cash", "النقد"), icon: <Wallet aria-hidden />, keyHint: "F8", onSelect: () => {} },
    { id: "close", label: t("Close shift", "إغلاق الوردية"), icon: <Power aria-hidden />, tone: "danger", group: "end", onSelect: () => {} },
  ];
  return (
    <div className="w-full max-w-sm">
      <ActionBar label={t("Till actions", "إجراءات الصندوق")} items={items} />
    </div>
  );
}

/** A cash keypad for an amount: the draft is the text of a MoneyInput; a hardware keyboard works while the focus is on the page or in the keypad. */
export function KeypadExample() {
  const t = useT();
  const [draft, setDraft] = useState("");
  const due = 230;
  const paid = parseAmount(draft) ?? 0;
  return (
    <Stack gap={4} className="w-full max-w-xs">
      <MoneyInput aria-label={t("Cash received", "النقد المستلم")} value={draft} onValueChange={setDraft} placeholder="0.00" />
      <Text size="sm" tone="muted">
        {t("Due", "المطلوب")}: <Money amount={due} />
      </Text>
      <Text size="sm" tone={paid >= due ? "default" : "danger"} aria-live="polite">
        {paid >= due ? t("Change", "الباقي") : t("Still due", "متبقٍّ على العميل")}: <Money amount={Math.abs(due - paid)} />
      </Text>
      <Keypad label={t("Amount keypad", "لوحة المبلغ")} value={draft} onValueChange={setDraft} maxLength={9} />
    </Stack>
  );
}

/** The same keypad as a PIN pad (no point, no 00), for a code that the app checks itself. */
export function KeypadPinExample() {
  const t = useT();
  const [pin, setPin] = useState("");
  return (
    <Stack gap={3} className="w-full max-w-xs">
      <Text size="sm" tone="muted" aria-live="polite">
        {t(`${pin.length} of 4 digits`, `${pin.length} من 4 أرقام`)}
      </Text>
      <Keypad label={t("PIN keypad", "لوحة الرمز")} mode="pin" maxLength={4} value={pin} onValueChange={setPin} />
    </Stack>
  );
}

/** A work tool fills the screen: the shell is as high as its box, the page box takes the rest and each region scrolls by itself. */
export function AppShellFillExample() {
  const t = useT();
  return (
    <div className="h-[24rem] w-full overflow-hidden rounded-card border border-line [clip-path:inset(0_round_var(--p-radius-card))]">
      <AppShell
        embedded
        fill
        density="touch"
        className="h-full"
        header={
          <>
            <Heading level={2} size={6}>
              {t("Till", "الصندوق")}
            </Heading>
            <span className="flex-1" />
            <Button size="sm" variant="secondary">
              {t("Hold", "تعليق")}
            </Button>
          </>
        }
      >
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 p-3">
          {[t("Catalog", "الكتالوج"), t("Cart", "السلة")].map((title) => (
            <section key={title} className="flex min-h-0 flex-col rounded-card border border-line">
              <Heading level={3} size={6} className="border-b border-line p-3">
                {title}
              </Heading>
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {Array.from({ length: 24 }, (_, i) => (
                  <li key={i} className="border-b border-line px-3 py-3 text-sm">
                    {title} {i + 1}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </AppShell>
    </div>
  );
}
