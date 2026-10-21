import { useRef, useState } from "react";
import { Button, Inline, Stack, useFlip, useLang } from "@percentsa/ui";
import { useT } from "~/lib/t";

const CITIES = [
  { id: "riyadh", en: "Riyadh", ar: "الرياض" },
  { id: "jeddah", en: "Jeddah", ar: "جدة" },
  { id: "makkah", en: "Makkah", ar: "مكة المكرمة" },
  { id: "madinah", en: "Madinah", ar: "المدينة المنورة" },
  { id: "dammam", en: "Dammam", ar: "الدمام" },
  { id: "abha", en: "Abha", ar: "أبها" },
];

export function FlipExample() {
  const t = useT();
  const lang = useLang();
  const [order, setOrder] = useState(CITIES);
  const list = useRef<HTMLOListElement>(null);
  // Each item has a stable data-flip id; when `order` changes, moved items glide to their new place.
  useFlip(list, [order]);
  const name = (c: (typeof CITIES)[number]) => t(c.en, c.ar);
  return (
    <Stack gap={4} className="w-full max-w-sm">
      <Inline gap={2}>
        <Button variant="secondary" size="sm" onClick={() => setOrder((o) => o.map((c) => [Math.random(), c] as const).sort((a, b) => a[0] - b[0]).map(([, c]) => c))}>
          {t("Shuffle", "خلط")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOrder((o) => o.toSorted((a, b) => name(a).localeCompare(name(b), lang)))}>
          {t("Sort by name", "ترتيب بالاسم")}
        </Button>
      </Inline>
      <ol ref={list} className="grid gap-2">
        {order.map((c) => (
          <li key={c.id} data-flip={c.id} className="rounded-field border border-line bg-surface px-4 py-3 text-sm">
            {name(c)}
          </li>
        ))}
      </ol>
    </Stack>
  );
}
