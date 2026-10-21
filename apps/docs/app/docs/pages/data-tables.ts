import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "card",
    "Card",
    "data",
    "Card",
    ["CardExample"],
    "A block of content with a title, description, action and footer. With href the whole card is one link, and buttons inside still work. The title is an h3; headingLevel changes it.",
    "كتلة محتوى بعنوان ووصف وإجراء وتذييل. مع href تصبح البطاقة كلها رابطًا واحدًا، وتبقى الأزرار داخلها تعمل. العنوان من مستوى h3، ويغيّره headingLevel.",
  ),
  p(
    "table",
    "Table",
    "data",
    "Table, TableHeader, TableBody, TableRow, TableHead, TableCell",
    ["TableExample"],
    "A styled native table that scrolls sideways on small screens. Put numbers in cells with align=\"end\" so the digits line up.",
    "جدول أصلي منسّق يمرَّر أفقيًا على الشاشات الصغيرة. ضع الأرقام في خلايا بـ align=\"end\" لتصطف خاناتها.",
  ),
  p(
    "data-table",
    "DataTable",
    "data",
    "DataTable",
    ["DataTableExample", "DataTableServerExample", "DataTableEmptyExample"],
    "A table with sorting, row selection, pages, loading and empty states. For server data, control sort and page and give pageCount; the table then shows the rows as given.",
    "جدول بفرز وتحديد صفوف وصفحات وحالتَي التحميل والفراغ. لبيانات الخادم، تحكّم في الفرز والصفحة ومرّر pageCount؛ فيعرض الجدول الصفوف كما وصلت.",
  ),
  p(
    "list",
    "List",
    "data",
    "List, ListItem",
    ["ListExample"],
    "Rows with an icon, title, description and a trailing value or action, with dividers between them. With href a row is one link.",
    "صفوف بأيقونة وعنوان ووصف وقيمة أو إجراء في النهاية، تفصل بينها خطوط. مع href يصبح الصف رابطًا واحدًا.",
  ),
  p(
    "description-list",
    "DescriptionList",
    "data",
    "DescriptionList",
    ["DescriptionListExample"],
    "Terms and their details, such as project facts. layout=\"columns\" puts them side by side from 768 px.",
    "مصطلحات وتفاصيلها، مثل بيانات مشروع. مع layout=\"columns\" تظهر جنبًا إلى جنب من 768 بكسل.",
  ),
];
