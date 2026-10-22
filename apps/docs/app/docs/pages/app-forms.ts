import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "filter-bar",
    "FilterBar",
    "app",
    "FilterBar, type FilterDef, type FilterValue",
    ["FilterBarExample", "FilterBarToolbarExample"],
    "Search and filter menus above a list or table. Chosen options show as removable tags, and “Clear filters” removes them all. actions puts the list's other controls (date range, columns, refresh, “⋯”) at the end of the first row, so one bar is the list toolbar.",
    "بحث وقوائم تصفية فوق قائمة أو جدول. تظهر الخيارات المحددة وسومًا يمكن إزالتها، ويزيلها زر «مسح عوامل التصفية» كلها. الخاصية actions تضع عناصر التحكم الأخرى للقائمة (الفترة، والأعمدة، والتحديث، و«⋯») في آخر الصف الأول، فيصبح الشريط الواحد شريط أدوات القائمة.",
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
    "auth-layout",
    "AuthLayout",
    "app",
    "AuthLayout",
    ["SignInExample", "SignUpExample", "ForgotPasswordExample", "OtpVerifyExample"],
    "Sign-in, sign-up and verification pages: brand, title, form and links in a narrow column, with a picture panel from 1024 px. The recipes use the existing fields.",
    "صفحات تسجيل الدخول وإنشاء الحساب والتحقق: الشعار والعنوان والنموذج والروابط في عمود ضيق، مع لوحة صورة من 1024 بكسل. تستخدم الوصفات الحقول الموجودة.",
  ),
];
