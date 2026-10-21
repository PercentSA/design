import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "app-shell",
    "AppShell",
    "app",
    "AppShell",
    ["AppShellExample"],
    "The frame of an app: a sidebar on the start side from 1024 px and in a sheet on smaller screens, a sticky header, and the page in <main>. Controls are compact unless density is comfortable. The embedded option drops the <header> and <main> landmarks and the skip link, for a shell inside a page that has its own.",
    "إطار التطبيق: شريط جانبي في جهة البداية من عرض 1024 بكسل، وفي لوحة منزلقة على الشاشات الأصغر، ورأس ثابت، والصفحة داخل <main>. عناصر التحكم مضغوطة ما لم تكن الكثافة مريحة. الخاصية embedded تحذف معالم <header> و<main> ورابط التخطي، لإطار داخل صفحة لها معالمها.",
  ),
  p(
    "sidebar",
    "Sidebar",
    "app",
    "Sidebar",
    ["SidebarExample"],
    "App navigation in sections, with icons, badges and the current page marked; the mark slides to the new page (no slide with reduced motion). It collapses to an icon rail with tooltips.",
    "تنقّل التطبيق في أقسام، مع أيقونات وشارات وتمييز الصفحة الحالية؛ تنزلق علامة التمييز إلى الصفحة الجديدة (دون انزلاق مع تقليل الحركة). يُطوى إلى شريط أيقونات مع تلميحات.",
  ),
  p(
    "command-palette",
    "CommandPalette",
    "app",
    "CommandPalette, useCommandShortcut",
    ["CommandPaletteExample"],
    "Search and run commands from the keyboard. Ctrl+K or ⌘K opens it; the search ignores case, accents and Arabic letter forms.",
    "ابحث عن الأوامر ونفّذها من لوحة المفاتيح. يفتحها Ctrl+K أو ⌘K، ويتجاهل البحث حالة الأحرف والتشكيل وأشكال الحروف العربية.",
  ),
];
