import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "kanban",
    "Kanban",
    "boards",
    "Kanban",
    ["KanbanExample", "KanbanWorkBoardExample"],
    "Columns of cards for a workflow. Drag a card with the mouse, or use its Move menu with the keyboard, touch or a screen reader; every move is announced. For a work board (orders, tickets, jobs) leave out `onMove`: there is no drag and no Move menu, and the actions are the content of `renderCard`. Each column can have a server `count` (`null` shows an ellipsis until it is known), a `state` (`loading` shows two skeleton cards on the first read; `error` shows the error and “Try again”, and the loaded cards stay above it), its own `empty` text, and pages: with `hasMore` a “Load more” button ends the column and the next page also loads by itself, once per page, when the end scrolls into view. `fill` makes the board as high as its parent with each column scrolling by itself; `columnWidth=\"fill\"` shares the width (at least 14rem) and the row scrolls sideways when the columns do not fit; `phone=\"switch\"` shows one column below 768 px with a switch (title and count) that scrolls in its own box, and `column` with `onColumnChange` lets the app keep the shown column in the address; `density=\"compact\"` tightens the cards. A column with no cards now shows “No items” (before, nothing).",
    "أعمدة من البطاقات لسير العمل. اسحب البطاقة بالفأرة، أو استخدم قائمة «نقل» فيها بلوحة المفاتيح أو اللمس أو قارئ الشاشة؛ ويُعلَن كل نقل. للوحة عمل (طلبات أو تذاكر أو مهام) احذف `onMove`: لا سحب ولا قائمة «نقل»، والإجراءات جزء من محتوى `renderCard`. يمكن لكل عمود `count` من الخادم (تعرض `null` علامة حذف حتى يُعرف)، و`state` (يعرض `loading` بطاقتين هيكليتين عند القراءة الأولى؛ ويعرض `error` الخطأ وزر «حاول مرة أخرى» وتبقى البطاقات المحمّلة فوقه)، ونص `empty` خاصًا به، وصفحات: مع `hasMore` يُختم العمود بزر «تحميل المزيد» وتُحمَّل الصفحة التالية تلقائيًا، مرة لكل صفحة، حين تظهر نهاية العمود. يجعل `fill` اللوحة بارتفاع أصلها ويمرّر كل عمود نفسه؛ ويقسّم `columnWidth=\"fill\"` العرض (14rem على الأقل) ويتمرر الصف أفقيًا إن لم تتسع الأعمدة؛ ويعرض `phone=\"switch\"` عمودًا واحدًا تحت 768 بكسل مع مبدّل (العنوان والعدد) يتمرر في صندوقه، ويتيح `column` مع `onColumnChange` أن يحفظ التطبيق العمود المعروض في العنوان؛ ويضغط `density=\"compact\"` البطاقات. العمود بلا بطاقات يعرض الآن «لا توجد عناصر» (كان لا يعرض شيئًا).",
  ),
  p(
    "calendar-view",
    "CalendarView",
    "boards",
    "CalendarView",
    ["CalendarViewExample"],
    "A month of events in the Gregorian or Hijri calendar. Up to 3 events show per day, the rest in a list; below 768 px it shows only the days that have events.",
    "شهر من الأحداث بالتقويم الميلادي أو الهجري. تظهر حتى 3 أحداث في اليوم والباقي في قائمة؛ وتحت 768 بكسل تظهر الأيام التي فيها أحداث فقط.",
  ),
];
