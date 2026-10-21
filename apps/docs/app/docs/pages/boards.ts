import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "kanban",
    "Kanban",
    "boards",
    "Kanban",
    ["KanbanExample"],
    "Columns of cards for a workflow. Drag a card with the mouse, or use its Move menu with the keyboard, touch or a screen reader; every move is announced.",
    "أعمدة من البطاقات لسير العمل. اسحب البطاقة بالفأرة، أو استخدم قائمة «نقل» فيها بلوحة المفاتيح أو اللمس أو قارئ الشاشة؛ ويُعلَن كل نقل.",
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
