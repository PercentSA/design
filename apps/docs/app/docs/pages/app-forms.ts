import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "filter-bar",
    "FilterBar",
    "app",
    "FilterBar, type FilterDef, type FilterValue",
    ["FilterBarExample", "FilterBarToolbarExample", "FilterBarCollapseExample"],
    "Search and filter menus above a list or table. Chosen options show as removable tags, and “Clear filters” removes them all. actions puts the list's other controls (date range, columns, refresh, “⋯”) at the end of the first row, so one bar is the list toolbar. collapseOnPhone folds the filter menus below 768 px into one “Filters” button with the count of chosen values; it opens a bottom sheet with one group per filter (checkboxes, or radios when not multiple) and “Clear filters”. A change applies at once. Search, actions and the tags stay on the bar; with no filters there is no button.",
    "بحث وقوائم تصفية فوق قائمة أو جدول. تظهر الخيارات المحددة وسومًا يمكن إزالتها، ويزيلها زر «مسح عوامل التصفية» كلها. الخاصية actions تضع عناصر التحكم الأخرى للقائمة (الفترة، والأعمدة، والتحديث، و«⋯») في آخر الصف الأول، فيصبح الشريط الواحد شريط أدوات القائمة. تطوي الخاصية collapseOnPhone قوائم التصفية تحت 768 بكسل في زر واحد «عوامل التصفية» مع عدد القيم المختارة؛ ويفتح ورقة سفلية فيها مجموعة لكل عامل (مربعات اختيار، أو أزرار اختيار واحد إن لم يكن multiple) وزر «مسح عوامل التصفية». ويُطبَّق التغيير فورًا. ويبقى البحث وactions والوسوم في الشريط؛ وإن لم توجد عوامل فلا يظهر الزر.",
  ),
  p(
    "settings",
    "SettingsSection, SettingsRow",
    "app",
    "SettingsSection, SettingsRow",
    ["SettingsExample"],
    "Settings pages: sections with a title and a Save button. In each row the label is on the start side and the control on the end side from 768 px.",
    "صفحات الإعدادات: أقسام بعنوان وزر حفظ. في كل صف يكون العنوان في جهة البداية والحقل في جهة النهاية من 768 بكسل.",
  ),
  p(
    "form-sheet",
    "FormSheet",
    "app",
    "FormSheet",
    ["FormSheetExample"],
    "An edit form in a sheet. Cancel and Save stay at the bottom while the form scrolls, and Enter in a text field saves. `pending` shows Save loading and keeps the sheet open. With `dirty`, every way to close it (Escape, a click outside, the close button, a drag, Cancel) asks “Discard your changes?” first, and the browser asks before the page is left. The sheet does not close itself after a submit: close it when the save succeeds.",
    "نموذج تعديل في لوحة جانبية. يبقى زرا «إلغاء» و«حفظ» في الأسفل أثناء تمرير النموذج، ويحفظ الضغط على Enter في حقل نصي. تعرض `pending` زر الحفظ قيد التحميل وتُبقي اللوحة مفتوحة. ومع `dirty` تسأل كل طرق الإغلاق (Escape، والنقر خارج اللوحة، وزر الإغلاق، والسحب، و«إلغاء») «تجاهل التغييرات؟» أولًا، ويسأل المتصفح قبل مغادرة الصفحة. لا تُغلق اللوحة نفسها بعد الإرسال: أغلقها عند نجاح الحفظ.",
  ),
  p(
    "record-section",
    "RecordSection",
    "app",
    "RecordSection",
    ["RecordSectionExample", "RecordSectionAutoExample"],
    "A record's facts as text in a card, with its edit action in the header. Terms and details sit side by side from 768 px. Empty details show “Not set”, so a missing value never looks like a layout gap. The heading is an h2 (`headingLevel={3}` inside a section). `layout=\"auto\"` puts them side by side when the section itself is 28rem wide or more (a container query), for a section in a narrow cell. `density=\"compact\"` is for dense records.",
    "بيانات السجل نصًا في بطاقة، مع إجراء التعديل في رأسها. يظهر العنوان والقيمة جنبًا إلى جنب من 768 بكسل. تعرض القيمة الفارغة «غير محدد»، فلا تبدو القيمة الناقصة فراغًا في التصميم. العنوان من المستوى h2 (أو `headingLevel={3}` داخل قسم). يجعل `layout=\"auto\"` العنوان والقيمة جنبًا إلى جنب عندما يبلغ عرض القسم نفسه 28rem أو أكثر (استعلام الحاوية)، لقسم في خلية ضيقة. ويناسب `density=\"compact\"` السجلات الكثيفة.",
  ),
  p(
    "auth-layout",
    "AuthLayout",
    "app",
    "AuthLayout",
    ["SignInExample", "SignUpExample", "ForgotPasswordExample", "OtpVerifyExample"],
    "Sign-in, sign-up and verification pages: brand, title, form and links in a narrow column, with a picture panel from 1024 px. The recipes use the existing fields.",
    "صفحات تسجيل الدخول وإنشاء الحساب والتحقق: الشعار والعنوان والنموذج والروابط في عمود ضيق، مع لوحة صورة من 1024 بكسل. تستخدم الوصفات الحقول الموجودة.",
  ),
];
