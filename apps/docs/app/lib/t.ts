import { useLang } from "@percentsa/ui";

/** Example text in both languages: t("Save", "حفظ"). */
export function useT() {
  const lang = useLang();
  return (en: string, ar: string) => (lang === "ar" ? ar : en);
}
