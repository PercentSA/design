import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "code-block",
    "CodeBlock",
    "data",
    "CodeBlock",
    ["CodeBlockExample", "CodeBlockHighlightedExample"],
    "Code with line numbers, a file name and a copy button, always left to right. For syntax colours, pass highlighted children (for example from Shiki); copy still copies the plain code.",
    "شيفرة مع أرقام الأسطر واسم الملف وزر نسخ، ودائمًا من اليسار إلى اليمين. لتلوين الشيفرة مرّر محتوى ملوّنًا (من Shiki مثلًا)، ويبقى النسخ للشيفرة الأصلية.",
  ),
  p(
    "json-viewer",
    "JsonViewer",
    "data",
    "JsonViewer",
    ["JsonViewerExample"],
    "Shows JSON data as a tree that opens and closes. Deep levels start closed and show their item count.",
    "يعرض بيانات JSON في شجرة تُفتح وتُطوى. تبدأ المستويات العميقة مطويّة وتعرض عدد عناصرها.",
  ),
];
