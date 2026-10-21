import { p, type DocPage } from "../page";

// CSS only (@percentsa/motion/styles.css): `imports` is empty, so the page shows the CSS import.
export const pages: DocPage[] = [
  p(
    "page-transitions",
    "data-page-transition",
    "motion",
    "",
    ["PageTransitionExample"],
    "Page changes with the browser's View Transitions. Opt in on `<html>`: `fade` (a short cross-fade) or `slash` (the new page wipes in behind an edge at the slash angle, in the reading direction). Navigate with React Router's `viewTransition`: make the `link` of PercentProvider pass it. Without the attribute nothing changes; browsers without View Transitions navigate as usual. No animation with reduced motion.",
    "انتقال بين الصفحات عبر View Transitions في المتصفح. فعّله على `<html>`: `fade` (تلاشٍ قصير) أو `slash` (تُكشف الصفحة الجديدة خلف حافة بزاوية الخط المائل، في اتجاه القراءة). انتقل باستخدام `viewTransition` في React Router: اجعل `link` في PercentProvider يمرّره. دون السمة لا يتغير شيء؛ والمتصفحات دون View Transitions تنتقل كالمعتاد. لا حركة مع تقليل الحركة.",
    "motion",
  ),
  p(
    "slash-hover",
    "p-slash-hover",
    "motion",
    "",
    ["SlashHoverExample"],
    "A class for secondary and ghost buttons and links: on hover and keyboard focus a fill wipes in behind an edge at the slash angle, in the reading direction, and the text turns to the page colour. Not for primary buttons: their fill is already there. No hover state on touch. With reduced motion, and in browsers without `lh` or `atan()` (Chrome < 111, Safari < 16.4, Firefox < 120), the fill fades in.",
    "صنف للأزرار الثانوية والشفافة وللروابط: عند المرور والتركيز بلوحة المفاتيح تُكشف خلفية خلف حافة بزاوية الخط المائل، في اتجاه القراءة، ويأخذ النص لون الصفحة. ليس للأزرار الأساسية: خلفيتها موجودة أصلًا. لا حالة مرور باللمس. ومع تقليل الحركة، وفي المتصفحات التي لا تدعم `lh` أو `atan()`، تظهر الخلفية بتلاشٍ.",
    "motion",
  ),
];
