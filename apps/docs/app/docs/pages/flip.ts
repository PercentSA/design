import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "use-flip",
    "useFlip",
    "motion",
    "useFlip",
    ["FlipExample"],
    "Reorder glide: give each item a stable data-flip id; when the deps change, moved items glide to their new place, new items fade in, removed items leave at once. Kanban, List (rows with data-flip) and FilterBar tags use it. The focus stays; no animation with reduced motion.",
    "انزلاق إعادة الترتيب: أعطِ كل عنصر معرّفًا ثابتًا في data-flip؛ وعند تغيّر القيم المتابَعة ينزلق كل عنصر منقول إلى مكانه الجديد، ويظهر العنصر الجديد تدريجيًا، ويختفي المحذوف فورًا. يستخدمه Kanban وList (الصفوف التي فيها data-flip) ووسوم FilterBar. يبقى التركيز في مكانه؛ ولا حركة مع تقليل الحركة.",
  ),
];
