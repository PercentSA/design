import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "stat",
    "Stat",
    "data",
    "Stat",
    ["StatExample"],
    'A key number with its change and an optional chart. The arrow is neutral; use tone="danger" only when the change is bad.',
    'رقم رئيسي مع مقدار تغيّره ورسم بياني اختياري. السهم محايد؛ استخدم tone="danger" فقط عندما يكون التغيّر سيئًا.',
  ),
  p(
    "timeline",
    "Timeline",
    "data",
    "Timeline",
    ["TimelineExample"],
    "Events in order, such as the progress of an order. The line is on the start side.",
    "أحداث مرتبة، مثل مراحل تنفيذ الطلب. يقع الخط في جهة البداية.",
  ),
  p(
    "accordion",
    "Accordion",
    "data",
    "Accordion",
    ["AccordionExample"],
    "Sections that open and close, one at a time or several. The arrow keys move between headers. Closed panels stay in the page, hidden: search engines see them, find-in-page opens them, and their content mounts at page load (load heavy media on open).",
    "أقسام تُفتح وتُغلق، واحدًا تلو الآخر أو عدة أقسام معًا. تنتقل مفاتيح الأسهم بين العناوين. تبقى الأقسام المغلقة في الصفحة مخفية: تراها محركات البحث، ويفتحها البحث في الصفحة، ويُحمَّل محتواها مع الصفحة (حمّل الوسائط الثقيلة عند الفتح).",
  ),
  p(
    "tree",
    "Tree",
    "data",
    "Tree, type TreeNode",
    ["TreeExample"],
    "Nested items such as files or categories. Full keyboard use; the left and right arrows swap in Arabic.",
    "عناصر متداخلة مثل الملفات أو التصنيفات. يعمل بالكامل من لوحة المفاتيح، ويتبادل السهمان الأيمن والأيسر في العربية.",
  ),
  p(
    "avatar",
    "Avatar, AvatarGroup",
    "data",
    "Avatar, AvatarGroup, initials",
    ["AvatarExample", "AvatarGroupExample"],
    "A person's picture, or their initials when there is none. A group shows the first few and a count of the rest.",
    "صورة الشخص، أو الأحرف الأولى من اسمه عند عدم وجودها. تعرض المجموعة أول بضعة أشخاص وعدد البقية.",
  ),
];
