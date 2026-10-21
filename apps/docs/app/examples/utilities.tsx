import { useState } from "react";
import { Search } from "lucide-react";
import { Button, LiveRegion, Stack, Text, useMediaQuery, useReducedMotion, VisuallyHidden } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function VisuallyHiddenExample() {
  const t = useT();
  return (
    <Button variant="secondary">
      <Search aria-hidden />
      <VisuallyHidden>{t("Search", "بحث")}</VisuallyHidden>
    </Button>
  );
}

export function LiveRegionExample() {
  const t = useT();
  const [count, setCount] = useState(0);
  return (
    <Stack gap={3}>
      <Button variant="secondary" className="w-fit" onClick={() => setCount(count + 1)}>
        {t("Add to cart", "أضف إلى السلة")}
      </Button>
      <Text size="sm" tone="muted">{t(`${count} items`, `${count} عناصر`)}</Text>
      <LiveRegion>{count > 0 ? t(`Cart has ${count} items`, `في السلة ${count} عناصر`) : ""}</LiveRegion>
    </Stack>
  );
}

export function MediaQueryExample() {
  const t = useT();
  const wide = useMediaQuery("(min-width: 768px)");
  const reduce = useReducedMotion();
  return (
    <Stack gap={1}>
      <Text>(min-width: 768px): {String(wide)}</Text>
      <Text>{t("Reduced motion", "تقليل الحركة")}: {String(reduce)}</Text>
    </Stack>
  );
}
