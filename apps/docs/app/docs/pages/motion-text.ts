import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "reveal-text",
    "RevealText",
    "motion",
    "RevealText",
    ["RevealTextExample"],
    "A heading whose words rise out of a mask once, when on screen, line after line. Words are never split, so Arabic letters stay joined. Screen readers read the text once. A fade with reduced motion. The children are one plain string (no elements).",
    "عنوان تصعد كلماته من خلف قناع مرة واحدة عند ظهوره، سطرًا بعد سطر. لا تُقسَم الكلمات، فتبقى الحروف العربية متصلة. يقرأ قارئ الشاشة النص مرة واحدة. ويصبح تلاشيًا مع تقليل الحركة. المحتوى نص عادي واحد (دون عناصر).",
    "motion",
  ),
  p(
    "number-roll",
    "NumberRoll",
    "motion",
    "NumberRoll",
    ["NumberRollExample"],
    "Digits roll to the new value when it changes (prices, totals). The first render shows the value as it is. Screen readers get only the value. No roll off screen or with reduced motion.",
    "تدور الأرقام إلى القيمة الجديدة عند تغيّرها (الأسعار والمجاميع). يعرض الظهور الأول القيمة كما هي. ويحصل قارئ الشاشة على القيمة فقط. لا دوران خارج الشاشة ولا مع تقليل الحركة.",
    "motion",
  ),
];
