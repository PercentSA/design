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
  p(
    "code-editor",
    "CodeEditor",
    "data",
    "CodeEditor",
    ["CodeEditorExample", "CodeEditorReadOnlyExample"],
    "An editor for code and settings files, with line numbers, search and errors on their lines. It is a controlled field: `value` and `onValueChange`. `diagnostics` marks lines (`{ line, message }`, 1-based) and marks each with an error line, a gutter mark and a visible list under the editor (“Line 2: message”; a diagnostic whose line is not in the text shows in the list without a mark, and without “Line” when the line is not a whole number of 1 or more); validate in your own code, the editor does not. `language` is `yaml` (default) or `text`. `readOnly` keeps focus, selection, search and copy. `label` names the editor for screen readers, and `minLines` sets its least height. The code is always left to right; the error list and the hint follow the page direction. Tab indents, so to leave the editor with the keyboard press Escape, then Tab (with text selected, press Escape twice); an editable editor shows this hint while it has focus, and screen readers read it as its description. CodeMirror makes it heavy, so it has its own entry, `@percentsa/ui/code-editor`: the root entry does not load it. Its words (search, errors) come from the provider strings.",
    "محرر للشيفرة وملفات الإعدادات، مع أرقام الأسطر والبحث والأخطاء على أسطرها. هو حقل متحكَّم به: `value` و`onValueChange`. تعلّم `diagnostics` الأسطر (`{ line, message }` والعدّ من 1) وتعلّم كل سطر بخط خطأ وعلامة في الهامش وقائمة ظاهرة تحت المحرر («السطر 2: الرسالة»؛ ويظهر الخطأ الذي لا يقع سطره في النص في القائمة دون علامة، ودون كلمة «السطر» إذا لم يكن رقم السطر عددًا صحيحًا من 1 فأكثر)؛ تحقّق من المحتوى في شيفرتك، فالمحرر لا يفعل ذلك. `language` هي `yaml` (الافتراضية) أو `text`. يُبقي `readOnly` التركيز والتحديد والبحث والنسخ. يسمّي `label` المحرر لقارئ الشاشة، ويحدد `minLines` أقل ارتفاع له. الشيفرة دائمًا من اليسار إلى اليمين، وتتبع قائمة الأخطاء والتلميح اتجاه الصفحة. يضيف Tab مسافة بادئة، فللخروج من المحرر بلوحة المفاتيح اضغط Escape ثم Tab (ومع وجود نص محدد اضغط Escape مرتين)؛ ويُظهر المحرر القابل للتعديل هذا التلميح ما دام التركيز فيه، ويقرؤه قارئ الشاشة وصفًا له. مكتبة CodeMirror ثقيلة، فله مدخل خاص `@percentsa/ui/code-editor`، ولا يحمّله المدخل الرئيسي. كلماته (البحث والأخطاء) تأتي من نصوص المزوّد.",
    "ui/code-editor",
  ),
  p(
    "code-diff",
    "CodeDiff",
    "data",
    "CodeDiff",
    ["CodeDiffExample"],
    "Two versions of a text side by side, with the changed lines and words marked. Read only. It has the same entry as CodeEditor, `@percentsa/ui/code-editor`, and the same look.",
    "نسختان من نص جنبًا إلى جنب، مع تعليم الأسطر والكلمات المتغيرة. للقراءة فقط. له مدخل CodeEditor نفسه `@percentsa/ui/code-editor` وشكله نفسه.",
    "ui/code-editor",
  ),
];
