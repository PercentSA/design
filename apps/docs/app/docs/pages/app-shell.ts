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
    "page-header",
    "PageHeader",
    "app",
    "PageHeader",
    ["PageHeaderListExample", "PageHeaderDocumentExample"],
    "The top of a list or record page: the title with status badges, a meta line, a back link to the list, one primary action, secondary actions and a “⋯” menu. Below 768 px the primary action is full width and “More actions” opens the rest; secondary buttons stay mounted, so their dialogs keep working. Danger items go last. `sticky` keeps it under the AppShell header from 768 px. Menu items take a `description`, for example why an item is disabled.",
    "أعلى صفحة قائمة أو سجل: العنوان مع شارات الحالة، وسطر معلومات، ورابط رجوع إلى القائمة، وإجراء رئيسي واحد، وإجراءات ثانوية، وقائمة «⋯». تحت 768 بكسل يملأ الإجراء الرئيسي العرض ويفتح زر «إجراءات أخرى» الباقي؛ وتبقى الأزرار الثانوية محمّلة فتستمر نوافذها في العمل. عناصر الخطر في الآخر. الخاصية sticky تُبقيه تحت رأس AppShell من 768 بكسل. تقبل عناصر القوائم description، مثل سبب تعطيل العنصر.",
  ),
  p(
    "print-area",
    "PrintArea",
    "app",
    "PrintArea, usePrint",
    ["PrintAreaExample"],
    "Prints one part of a page on A4, portrait or landscape, black on white in every theme. The header repeats at the top of every page, and the page numbers are at the bottom. Nothing else on the page prints, also not an open sheet. The area is hidden on screen. Render the rows before print() (with flushSync when they change in the same click). Over 500 rows, turn the print button off and show tooManyRowsToPrint: export the list, or filter it.",
    "تطبع جزءًا واحدًا من الصفحة على ورق A4، طوليًا أو عرضيًا، بالأسود على الأبيض في كل مظهر. يتكرر الرأس أعلى كل صفحة، وأرقام الصفحات في أسفلها. لا يُطبع شيء آخر من الصفحة، ولا لوحة مفتوحة. المنطقة مخفية على الشاشة. اعرض الصفوف قبل print()‎ (مع flushSync إن تغيّرت في النقرة نفسها). فوق 500 صف، عطّل زر الطباعة واعرض tooManyRowsToPrint: صدّر القائمة أو ضيّق التصفية.",
  ),
  p(
    "sidebar",
    "Sidebar",
    "app",
    "Sidebar, useSidebarRail",
    ["SidebarExample"],
    "App navigation in sections, with icons, badges and the current page marked; the mark slides to the new page (no slide with reduced motion). It collapses to an icon rail with tooltips. Give PercentProvider the router's location, and a clicked link shows a pending bar at once, until the new page is there.",
    "تنقّل التطبيق في أقسام، مع أيقونات وشارات وتمييز الصفحة الحالية؛ تنزلق علامة التمييز إلى الصفحة الجديدة (دون انزلاق مع تقليل الحركة). يُطوى إلى شريط أيقونات مع تلميحات. مرّر موقع الموجّه إلى PercentProvider عبر الخاصية location، فيُظهر الرابط المنقور شريط انتظار فورًا حتى تظهر الصفحة الجديدة.",
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
