import type { Localized } from "@percentsa/ui";
import { p, type DocPage, type Group } from "./page";
import { pages as dataTables } from "./pages/data-tables";
import { pages as dataItems } from "./pages/data-items";
import { pages as boards } from "./pages/boards";
import { pages as code } from "./pages/code";
import { pages as charts } from "./pages/charts";
import { pages as appShell } from "./pages/app-shell";
import { pages as appForms } from "./pages/app-forms";
import { pages as business } from "./pages/business";
import { pages as motionText } from "./pages/motion-text";
import { pages as flip } from "./pages/flip";
import { pages as motionCss } from "./pages/motion-css";

export type { DocPage, Group };

const GROUP_LIST: { id: Group; title: Localized }[] = [
  { id: "brand", title: { en: "Brand", ar: "الهوية" } },
  { id: "text", title: { en: "Text", ar: "النصوص" } },
  { id: "layout", title: { en: "Layout", ar: "التخطيط" } },
  { id: "actions", title: { en: "Actions", ar: "الإجراءات" } },
  { id: "forms", title: { en: "Forms", ar: "النماذج" } },
  { id: "saudi-forms", title: { en: "Saudi forms and dates", ar: "نماذج وتواريخ سعودية" } },
  { id: "overlays", title: { en: "Overlays", ar: "النوافذ المنبثقة" } },
  { id: "feedback", title: { en: "Feedback", ar: "الحالة والتنبيهات" } },
  { id: "navigation", title: { en: "Navigation", ar: "التنقل" } },
  { id: "data", title: { en: "Data display", ar: "عرض البيانات" } },
  { id: "boards", title: { en: "Boards and calendars", ar: "اللوحات والتقويمات" } },
  { id: "charts", title: { en: "Charts", ar: "الرسوم البيانية" } },
  { id: "app", title: { en: "App patterns", ar: "أنماط التطبيقات" } },
  { id: "business", title: { en: "Invoices and support", ar: "الفواتير والدعم" } },
  { id: "saudi", title: { en: "Saudi and bilingual kit", ar: "أدوات سعودية وثنائية اللغة" } },
  { id: "motion", title: { en: "Motion", ar: "الحركة" } },
  { id: "utilities", title: { en: "Utilities", ar: "أدوات مساعدة" } },
];

export const PAGES: DocPage[] = [
  p("mark", "Mark", "brand", "Mark", ["MarkExample"], "The flat % mark. Never mirror, shade or redraw it. Decorative unless it has a label.", "علامة % المسطحة. لا تعكسها ولا تظللها ولا تعِد رسمها. زخرفية ما لم يكن لها اسم."),
  p("logo", "Logo", "brand", "Logo", ["LogoExample"], "The logo in 7 versions, from one geometry. Icon at the reading start; use icon + the page language in headers. Never redraw it.", "الشعار بسبع نسخ من هندسة واحدة. الأيقونة في بداية القراءة؛ استخدم الأيقونة مع لغة الصفحة في الترويسات. لا تعِد رسمه."),
  p("riyal-sign", "RiyalSign", "brand", "RiyalSign", ["RiyalSignExample"], "The Saudi riyal sign (SAMA), drawn as SVG because fonts do not have it yet. Use Money for amounts.", "رمز الريال السعودي (ساما) مرسوم بصيغة SVG لأن الخطوط لا تتضمنه بعد. استخدم Money للمبالغ."),
  p("made-in-ksa", "MadeInKsa", "brand", "MadeInKsa", ["MadeInKsaExample"], "“Made in KSA” with the flag, in the page language.", "عبارة «صُنع في السعودية» مع العلم بلغة الصفحة."),

  p("display", "Display", "text", "Display", ["DisplayExample"], "Large page and section titles. Arabic gets weight 700, no negative tracking and a taller line by itself; do not add leading-* or tracking-*.", "عناوين الصفحات والأقسام الكبيرة. تحصل العربية تلقائيًا على وزن 700 وتباعد صفري وسطر أطول؛ لا تضف leading-* أو tracking-*."),
  p("heading", "Heading", "text", "Heading", ["HeadingExample"], "Headings h1–h6. `level` sets the element, `size` can change the look without changing the outline.", "العناوين من h1 إلى h6. يحدد level العنصر، ويغيّر size الشكل دون تغيير بنية الصفحة."),
  p("text", "Text", "text", "Text", ["TextExample"], "Body text in four sizes and three tones (fg, fg-2, fg-3). All tones pass WCAG AA.", "نص المحتوى بأربعة أحجام وثلاث درجات. كل الدرجات تجتاز معيار WCAG AA."),
  p("label", "Label", "text", "Label", ["LabelExample"], "Small section label: mono and upper case in English, plain in Arabic.", "عنوان صغير للأقسام: بخط أحادي وأحرف كبيرة بالإنجليزية، وعادي بالعربية."),
  p("link", "Link", "text", "Link", ["LinkExample"], "Text link. `external` opens a new tab safely and tells screen readers. Uses the router link from PercentProvider.", "رابط نصي. يفتح external تبويبًا جديدًا بأمان ويُعلم قارئ الشاشة. يستخدم رابط الموجّه من PercentProvider."),
  p("code-kbd", "Code, Kbd", "text", "Code, Kbd", ["CodeKbdExample"], "Inline code and keys. Always left to right, also inside Arabic text.", "شيفرة ومفاتيح داخل النص. دائمًا من اليسار إلى اليمين حتى داخل النص العربي."),
  p("blockquote", "Blockquote", "text", "Blockquote", ["BlockquoteExample"], "A quote with an optional source.", "اقتباس مع مصدر اختياري."),
  p("prose", "Prose", "text", "Prose", ["ProseExample"], "Styles rich text (privacy pages, case studies): headings, lists, links, code.", "ينسّق النص الطويل (صفحات الخصوصية ودراسات الحالة): العناوين والقوائم والروابط والشيفرة."),
  p("highlight", "Highlight", "text", "Highlight", ["HighlightExample"], "Inverted text for search matches.", "نص معكوس الألوان لنتائج البحث."),
  p("formatted-number", "FormattedNumber", "text", "FormattedNumber, formatNumber", ["FormattedNumberExample"], "Numbers with Western digits in both languages; compact units in words in Arabic.", "أرقام بالأرقام الغربية في اللغتين؛ والوحدات المختصرة بالكلمات في العربية."),

  p("container", "Container", "layout", "Container", ["ContainerExample"], "Page width and the page gutter (5vw).", "عرض الصفحة والهامش الجانبي (5vw)."),
  p("section", "Section", "layout", "Section", ["SectionExample"], "A page section with vertical spacing in three sizes.", "قسم من الصفحة بمسافات رأسية بثلاثة أحجام."),
  p("stack-inline", "Stack, Inline", "layout", "Stack, Inline", ["StackInlineExample"], "Vertical and wrapping horizontal groups with a gap from the spacing scale.", "مجموعات رأسية وأفقية ملتفة بمسافة من مقياس المسافات."),
  p("grid", "Grid", "layout", "Grid", ["GridExample"], "Fixed columns from 768 px, or as many columns of a minimum width as fit.", "أعمدة ثابتة من 768 بكسل، أو أكبر عدد من الأعمدة بعرض أدنى."),
  p("split", "Split", "layout", "Split", ["SplitExample"], "Two columns from 768 px, stacked on phones.", "عمودان من 768 بكسل، ومتراصّان على الجوال."),
  p("aspect-ratio", "AspectRatio", "layout", "AspectRatio", ["AspectRatioExample"], "Keeps media at a ratio.", "يحافظ على نسبة أبعاد الوسائط."),
  p("separator", "Separator", "layout", "Separator", ["SeparatorExample"], "A 1 px line, horizontal or vertical.", "خط بسماكة 1 بكسل، أفقي أو رأسي."),
  p("scroll-area", "ScrollArea", "layout", "ScrollArea", ["ScrollAreaExample"], "A scrolling box with thin scroll bars in the Percent style.", "مربع قابل للتمرير بأشرطة رفيعة بأسلوب برسنت."),
  p("surface", "Surface", "layout", "Surface", ["SurfaceExample"], "Card background: surface, raised or outline, with the radius tokens.", "خلفية البطاقات: عادية أو مرتفعة أو بإطار، مع رموز الانحناء."),
  p("bleed", "Bleed", "layout", "Bleed", ["BleedExample"], "Full width inside a Container: cancels the page gutter.", "عرض كامل داخل Container: يلغي الهامش الجانبي."),

  p("button", "Button", "actions", "Button", ["ButtonVariants", "ButtonSizes", "ButtonStates"], "Primary (one per view), secondary, ghost, danger and link. Loading keeps the width. Icon-only buttons need aria-label (a type error without it).", "أساسي (واحد في كل شاشة) وثانوي وشفاف وخطر ورابط. حالة التحميل تحافظ على العرض. أزرار الأيقونات تحتاج aria-label."),
  p("button-group", "ButtonGroup", "actions", "ButtonGroup", ["ButtonGroupExample"], "Related buttons in a labelled group.", "أزرار مترابطة في مجموعة لها اسم."),
  p("toggle", "Toggle", "actions", "Toggle", ["ToggleExample"], "An on/off button (aria-pressed).", "زر تشغيل وإيقاف (aria-pressed)."),
  p("segmented-control", "SegmentedControl, ToggleGroup", "actions", "SegmentedControl, ToggleGroup", ["SegmentedControlExample", "ToggleGroupExample"], "One choice that is always set (SegmentedControl), or several on/off choices (ToggleGroup). In SegmentedControl the fill slides to the chosen option (no slide with reduced motion).", "اختيار واحد محدد دائمًا (SegmentedControl)، أو عدة اختيارات تشغيل وإيقاف (ToggleGroup). في SegmentedControl تنزلق الخلفية إلى الخيار المختار (دون انزلاق مع تقليل الحركة)."),
  p("copy-button", "CopyButton", "actions", "CopyButton", ["CopyButtonExample"], "Copies a value and announces “Copied”.", "ينسخ قيمة ويعلن «تم النسخ»."),
  p("back-to-top", "BackToTop", "actions", "BackToTop", ["BackToTopExample"], "A link to #top: works without JavaScript.", "رابط إلى ‎#top: يعمل دون جافاسكربت."),

  p("field", "Field", "forms", "Field", ["FieldExample"], "Label, control, hint, error and counter. The control inside gets its id, aria-describedby and aria-invalid automatically.", "العنوان والحقل والتلميح والخطأ والعدّاد. يحصل الحقل تلقائيًا على المعرّف وaria-describedby وaria-invalid."),
  p("input", "Input", "forms", "Input", ["InputExample"], "Text field. `start` and `end` hold icons or units inside the box.", "حقل نصي. يحمل start وend الأيقونات أو الوحدات داخل الحقل."),
  p("textarea", "Textarea", "forms", "Textarea", ["TextareaExample"], "Grows with the text up to 24 rem, then scrolls.", "يكبر مع النص حتى 24rem ثم يُمرَّر."),
  p("select", "Select", "forms", "Select", ["SelectExample"], "A short list of options.", "قائمة قصيرة من الخيارات."),
  p("combobox", "Combobox", "forms", "Combobox", ["ComboboxExample"], "A select you can type into, for long lists. Matching ignores case, accents and Arabic letter forms (أ/ا, ة/ه, ى/ي).", "قائمة تقبل الكتابة للقوائم الطويلة. يتجاهل البحث حالة الأحرف والتشكيل وأشكال الحروف العربية."),
  p("checkbox", "Checkbox", "forms", "Checkbox", ["CheckboxExample"], "A yes/no choice with a label and optional description.", "اختيار نعم/لا مع عنوان ووصف اختياري."),
  p("radio-group", "RadioGroup", "forms", "RadioGroup", ["RadioGroupExample"], "One choice from a short list, arrow keys move between options.", "اختيار واحد من قائمة قصيرة، وتتنقل الأسهم بين الخيارات."),
  p("choice-cards", "ChoiceCardGroup", "forms", "ChoiceCardGroup", ["ChoiceCardsExample"], "Large choices with descriptions. Native inputs: they post with the form before JavaScript loads.", "خيارات كبيرة مع وصف. حقول أصلية: تُرسل مع النموذج قبل تحميل جافاسكربت."),
  p("chip-group", "ChipGroup", "forms", "ChipGroup", ["ChipGroupExample"], "Pill-shaped choices in a row. Native inputs.", "خيارات على شكل كبسولات في صف. حقول أصلية."),
  p("switch", "Switch", "forms", "Switch", ["SwitchExample"], "An on/off setting that applies at once.", "إعداد تشغيل وإيقاف يُطبَّق فورًا."),
  p("slider", "Slider", "forms", "Slider", ["SliderExample"], "A value or a range. Inside Field one thumb takes the field label; a range is a group with the field label, and its thumbs are named Minimum and Maximum (or `thumbLabels`).", "قيمة أو نطاق. داخل Field يأخذ المقبض الواحد عنوان الحقل؛ والنطاق مجموعة بعنوان الحقل، واسما مقبضيه «الحد الأدنى» و«الحد الأقصى» (أو thumbLabels)."),
  p("number-input", "NumberInput", "forms", "NumberInput", ["NumberInputExample"], "A number with step buttons. Accepts Arabic digits.", "رقم مع أزرار الزيادة والإنقاص. يقبل الأرقام العربية."),
  p("password-input", "PasswordInput", "forms", "PasswordInput", ["PasswordInputExample"], "Password with a show/hide button.", "كلمة مرور مع زر إظهار وإخفاء."),
  p("search-input", "SearchInput", "forms", "SearchInput", ["SearchInputExample"], "A search box with the search icon.", "مربع بحث مع أيقونة البحث."),
  p("fieldset", "Fieldset", "forms", "Fieldset", ["FieldsetExample"], "Groups choices under a legend with a hint and an error.", "يجمع الخيارات تحت عنوان مع تلميح وخطأ."),
  p("honeypot", "Honeypot", "forms", "Honeypot", ["HoneypotExample"], "An invisible field that only bots fill. Reject the form on the server when it has a value.", "حقل غير مرئي لا تملؤه إلا الروبوتات. ارفض النموذج على الخادم إذا كانت له قيمة."),

  p("phone-input", "PhoneInput", "saudi-forms", "PhoneInput, normalizePhone", ["PhoneInputExample"], "GCC phone number with a country menu. Accepts Arabic digits, spaces and +966; store normalizePhone(). With a `name`, the form also posts the country code as `<name>-country` (or `countryName`), also without JavaScript.", "رقم جوال خليجي مع قائمة الدول. يقبل الأرقام العربية والمسافات و+966؛ احفظ ناتج normalizePhone(). مع name يرسل النموذج رمز الدولة أيضًا باسم ‎<name>-country (أو countryName)، حتى دون JavaScript."),
  p("otp-input", "OtpInput", "saudi-forms", "OtpInput", ["OtpInputExample"], "One box per digit. Paste and SMS autofill fill all boxes. Left to right in Arabic too.", "مربع لكل رقم. اللصق والتعبئة التلقائية من الرسائل تملأ كل المربعات. من اليسار إلى اليمين في العربية أيضًا."),
  p("money-input", "MoneyInput", "saudi-forms", "MoneyInput, parseAmount", ["MoneyInputExample"], "An amount in riyals with the Riyal sign on the left. Arabic digits and separators become Western.", "مبلغ بالريال مع رمز الريال على اليسار. تتحول الأرقام والفواصل العربية إلى غربية."),
  p("iban-input", "IbanInput", "saudi-forms", "IbanInput, saudiError", ["IbanInputExample"], "Saudi IBAN in groups of four, checked with mod-97.", "آيبان سعودي في مجموعات من أربعة، يُتحقق منه بخوارزمية mod-97."),
  p("id-inputs", "NationalIdInput, CrInput, VatInput", "saudi-forms", "NationalIdInput, CrInput, VatInput, saudiError", ["IdInputsExample"], "National ID or iqama (10 digits, check digit), commercial registration (10 digits), VAT number (15 digits).", "رقم الهوية أو الإقامة (10 أرقام مع رقم تحقق)، والسجل التجاري (10 أرقام)، والرقم الضريبي (15 رقمًا)."),
  p("national-address", "NationalAddress", "saudi-forms", "NationalAddress", ["NationalAddressExample"], "All parts of the Saudi national address, including the short address.", "كل أجزاء العنوان الوطني السعودي، ومنها العنوان المختصر."),
  p("file-drop", "FileDrop", "saudi-forms", "FileDrop", ["FileDropExample"], "Drop zone around a real file input. Refuses files that are too large or of the wrong type.", "منطقة إفلات حول حقل ملفات حقيقي. ترفض الملفات الكبيرة أو غير المقبولة."),
  p("calendar", "Calendar", "saudi-forms", "Calendar", ["CalendarExample"], "Gregorian or Hijri (Umm al-Qura) month grid; each day also shows its number in the other calendar. Weeks start on Sunday.", "شبكة شهر ميلادي أو هجري (أم القرى)؛ ويظهر كل يوم رقمه في التقويم الآخر أيضًا. يبدأ الأسبوع يوم الأحد."),
  p("date-picker", "DatePicker", "saudi-forms", "DatePicker", ["DatePickerExample"], "A field that opens the Calendar. It posts an ISO date whatever calendar is shown.", "حقل يفتح التقويم. يُرسل تاريخًا بصيغة ISO أيًا كان التقويم المعروض."),

  p("dialog", "Dialog", "overlays", "Dialog, DialogClose", ["DialogExample"], "A modal window with a title, a close button and an optional footer.", "نافذة منبثقة بعنوان وزر إغلاق وتذييل اختياري."),
  p("alert-dialog", "AlertDialog", "overlays", "AlertDialog", ["AlertDialogExample"], "Asks before something that cannot be undone. Focus starts on Cancel.", "يسأل قبل إجراء لا يمكن التراجع عنه. يبدأ التركيز على «إلغاء»."),
  p("sheet", "Sheet", "overlays", "Sheet", ["SheetExample"], "A panel from a side or the bottom. `end` is right in English and left in Arabic. On touch, drag it toward its side to close it: past 30 % of its size or with a flick, else it springs back. A bottom sheet drags from its handle and header, or from the content when that is scrolled to the top. A mouse never drags. Sliders, text fields, horizontal scrollers, menus opened from the sheet and parts marked `data-sheet-no-drag` keep their own drag.", "لوحة من جانب أو من الأسفل. end يمين في الإنجليزية ويسار في العربية. باللمس تُغلق بسحبها نحو جانبها: بعد 30 % من حجمها أو بسحبة سريعة، وإلا تعود إلى مكانها. اللوحة السفلية تُسحب من مقبضها وعنوانها، أو من المحتوى حين يكون في أعلاه. الفأرة لا تسحب. المنزلقات والحقول النصية والمناطق التي تُمرَّر أفقيًا والقوائم المفتوحة منها والأجزاء التي تحمل data-sheet-no-drag تحتفظ بسحبها."),
  p("popover", "Popover", "overlays", "Popover", ["PopoverExample"], "Floating content next to its trigger.", "محتوى عائم بجانب العنصر الذي يفتحه."),
  p("tooltip", "Tooltip", "overlays", "Tooltip", ["TooltipExample"], "A short label for icon buttons. Not for important information.", "عنوان قصير لأزرار الأيقونات. ليس للمعلومات المهمة."),
  p("hover-card", "HoverCard", "overlays", "HoverCard", ["HoverCardExample"], "A preview on hover for mouse users.", "معاينة عند التمرير لمستخدمي الفأرة."),
  p("dropdown-menu", "DropdownMenu", "overlays", "DropdownMenu", ["DropdownMenuExample"], "A menu of actions from a button. Items: label, icon, shortcut, danger, separators and headings.", "قائمة إجراءات من زر. العناصر: عنوان وأيقونة واختصار وخطر وفواصل وعناوين."),
  p("context-menu", "ContextMenu", "overlays", "ContextMenu", ["ContextMenuExample"], "A right-click menu for an area. Offer the same actions somewhere visible too.", "قائمة النقر بالزر الأيمن لمنطقة. وفّر الإجراءات نفسها في مكان ظاهر أيضًا."),
  p("toast", "Toast", "overlays", "Toaster, toast", ["ToastExample"], "Short messages at the bottom. Place <Toaster /> once, in the root layout, and call toast() anywhere. A toast made while no Toaster is on the page is dropped.", "رسائل قصيرة في الأسفل. ضع ‎<Toaster />‎ مرة واحدة في التخطيط الجذري، واستدعِ toast()‎ من أي مكان. الرسالة التي تُنشأ ولا يوجد Toaster في الصفحة تُهمل."),
  p("consent-banner", "ConsentBanner", "overlays", "ConsentBanner, readConsent", ["ConsentBannerExample"], "Cookie consent for analytics (PDPL). Reject is as easy as accept; the server reads the choice with readConsent().", "موافقة ملفات الارتباط للتحليلات (نظام حماية البيانات الشخصية). الرفض بسهولة القبول؛ ويقرأ الخادم الاختيار عبر readConsent()."),

  p("alert", "Alert", "feedback", "Alert", ["AlertExample"], "A message in the page. Errors and warnings are announced at once.", "رسالة داخل الصفحة. تُعلَن الأخطاء والتحذيرات فورًا."),
  p("badge", "Badge", "feedback", "Badge", ["BadgeExample"], "A small label or count.", "عنوان صغير أو عدد."),
  p("tag", "Tag", "feedback", "Tag", ["TagExample"], "A removable label (filters, chosen items).", "عنوان قابل للإزالة (عوامل التصفية، العناصر المختارة)."),
  p("status-dot", "StatusDot", "feedback", "StatusDot", ["StatusDotExample"], "The only place green is allowed. Always with text.", "المكان الوحيد المسموح فيه بالأخضر. دائمًا مع نص."),
  p("progress", "Progress, ProgressRing", "feedback", "Progress, ProgressRing", ["ProgressExample"], "Progress bar and ring with their values for screen readers.", "شريط وحلقة تقدم مع قيمهما لقارئ الشاشة."),
  p("spinner", "Spinner", "feedback", "Spinner", ["SpinnerExample"], "Loading indicator from the % mark. Opacity only, so it also plays with reduced motion. With a provider brand it shows the brand's spinner, else a plain ring.", "مؤشر تحميل من علامة %. يغيّر الشفافية فقط، فيعمل مع تقليل الحركة أيضًا. مع هوية في المزوّد يعرض مؤشر الهوية، وإلا حلقة بسيطة."),
  p("skeleton", "Skeleton", "feedback", "Skeleton", ["SkeletonExample"], "Grey blocks while content loads.", "كتل رمادية أثناء تحميل المحتوى."),
  p("empty-state", "EmptyState", "feedback", "EmptyState", ["EmptyStateExample"], "What to show when there is nothing yet, with the next action.", "ما يُعرض عندما لا يوجد شيء بعد، مع الإجراء التالي."),

  p("site-header", "SiteHeader", "navigation", "SiteHeader, type SiteWidth", ["SiteHeaderExample"], "Header: brand, section links, actions; a phone menu below 768 px (none without links: the actions stay visible). Includes the skip link. position: fixed (default), sticky or static; width: content width like Container (default full).", "ترويسة: الهوية وروابط الأقسام والإجراءات؛ وقائمة للجوال تحت 768 بكسل (لا قائمة دون روابط: تبقى الإجراءات ظاهرة). تتضمن رابط التخطي. position: ثابتة (الافتراضي) أو لاصقة أو عادية؛ width: عرض المحتوى مثل Container (الافتراضي كامل)."),
  p("mobile-menu", "MobileMenu", "navigation", "MobileMenu", ["MobileMenuExample"], "Full-screen phone menu on a native dialog.", "قائمة جوال بملء الشاشة على عنصر dialog أصلي."),
  p("tabs", "Tabs", "navigation", "Tabs", ["TabsExample"], "Switch between views of the same subject. Arrow keys follow the reading direction. The underline slides to the chosen tab (no slide with reduced motion).", "التبديل بين عروض الموضوع نفسه. تتبع الأسهم اتجاه القراءة. ينزلق الخط السفلي إلى التبويب المختار (دون انزلاق مع تقليل الحركة)."),
  p("breadcrumbs", "Breadcrumbs", "navigation", "Breadcrumbs", ["BreadcrumbsExample"], "Where the page sits. The last item is the current page.", "موقع الصفحة. العنصر الأخير هو الصفحة الحالية."),
  p("pagination", "Pagination", "navigation", "Pagination, paginationRange", ["PaginationExample"], "Page links (with href) or buttons (with onPageChange). A gap hides at least two pages.", "روابط صفحات (مع href) أو أزرار (مع onPageChange). تخفي الفجوة صفحتين على الأقل."),
  p("steps", "Steps", "navigation", "Steps", ["StepsExample"], "Progress through a flow.", "التقدم في خطوات مسار."),
  p("skip-link", "SkipLink", "navigation", "SkipLink", ["SkipLinkExample"], "The first link of the page, visible on keyboard focus.", "أول رابط في الصفحة، يظهر عند التركيز بلوحة المفاتيح."),
  p("lang-switch", "LangSwitch", "navigation", "LangSwitch", ["LangSwitchExample"], "A real link to the same page in the other language, named in that language.", "رابط حقيقي للصفحة نفسها باللغة الأخرى، مسمى بتلك اللغة."),
  p("site-footer", "SiteFooter", "navigation", "SiteFooter, type FooterGroup, type SocialLink", ["SiteFooterExample", "SiteFooterSlotsExample"], "Footer with the mark, email, links and “Made in KSA”. Optional slots for other brands: brand (logo), contact, groups (link columns), social (icon links), notice, badges (null hides “Made in KSA”) and children (a full-width row). width: content width like Container (default full; borders stay full width).", "تذييل بالعلامة والبريد والروابط و«صُنع في السعودية». خانات اختيارية للهويات الأخرى: brand (الشعار) وcontact وgroups (أعمدة روابط) وsocial (روابط بأيقونات) وnotice وbadges (القيمة null تُخفي «صُنع في السعودية») وchildren (صف بعرض كامل). width: عرض المحتوى مثل Container (الافتراضي كامل؛ تبقى الحدود بعرض كامل)."),
  p("theme-switch", "ThemeSwitch", "navigation", "ThemeSwitch, THEME_SCRIPT, useTheme", ["ThemeSwitchExample"], "System, Light or Dark. Sets data-theme on <html> and keeps the choice in this browser. Put THEME_SCRIPT in <head> so the choice applies before first paint.", "النظام أو فاتح أو داكن. يضبط data-theme على ‎<html>‎ ويحفظ الاختيار في هذا المتصفح. ضع THEME_SCRIPT في ‎<head>‎ ليُطبَّق الاختيار قبل أول عرض."),

  p("money", "Money, formatMoney", "saudi", "Money, formatMoney", ["MoneyExample", "MoneyOptionsExample"], "Amounts: the Riyal sign left of the number with a space, Western digits, in both directions. Never “SAR”. `maxDecimals` keeps up to 6 decimals for unit prices; `accounting` puts negative amounts in brackets. Zero never shows a minus sign, and a broken amount shows “—”.", "المبالغ: رمز الريال يسار الرقم مع مسافة، بالأرقام الغربية، في الاتجاهين. لا تكتب «SAR» أبدًا. يحتفظ maxDecimals بما يصل إلى 6 منازل عشرية لأسعار الوحدات، ويضع accounting المبالغ السالبة بين قوسين. لا يظهر الصفر بعلامة سالب أبدًا، ويظهر المبلغ غير الصالح «—»."),
  p("phone-text", "PhoneText", "saudi", "PhoneText, formatPhone, phoneLinks", ["PhoneTextExample"], "A stored phone number for display: grouped, left to right, as a call link, with an optional WhatsApp link. A value that is not a valid GCC number shows as it is, without links.", "رقم جوال محفوظ للعرض: مجمّع ومن اليسار إلى اليمين، كرابط اتصال، مع رابط واتساب اختياري. القيمة التي ليست رقمًا خليجيًا صحيحًا تظهر كما هي دون روابط."),
  p("dates", "formatDate", "saudi", "formatDate, hijriParts", ["DatesExample"], "Gregorian and Hijri (Umm al-Qura) dates with Western digits. Riyadh time by default, so the server and the browser agree.", "تواريخ ميلادية وهجرية (أم القرى) بالأرقام الغربية. بتوقيت الرياض افتراضيًا ليتفق الخادم والمتصفح."),
  p("time-text", "TimeText", "saudi", "TimeText, formatDateTime, formatRelative", ["TimeTextExample"], "Dates and times in Riyadh time on a 12-hour clock: the time for today, a word for yesterday and tomorrow, the day for older dates. Hover, focus or tap shows the exact value. A time without a zone is read as UTC. formatTimeOfDay shows a time of day such as opening hours.", "التواريخ والأوقات بتوقيت الرياض بنظام 12 ساعة: الوقت لليوم، وكلمة لأمس وغدٍ، والتاريخ للأيام الأقدم. يظهر الوقت الكامل عند التمرير أو التركيز أو اللمس. يُقرأ الوقت الذي ليس له منطقة زمنية بتوقيت UTC. وتعرض formatTimeOfDay وقتًا من اليوم مثل ساعات العمل."),
  p("validators", "Validators", "saudi", "isSaudiIban, isNationalId, getSaudiIdType, isCrNumber, isVatNumber, isShortAddress, saudiError", ["ValidatorsExample"], "Checks for Saudi numbers. They accept spaces and Arabic digits, and work on the server.", "تحقق من الأرقام السعودية. تقبل المسافات والأرقام العربية وتعمل على الخادم."),
  p("isolate", "isolate", "saudi", "isolate", ["IsolateExample"], "Keeps ids, codes and English words whole inside Arabic text (Unicode isolates).", "يحافظ على المعرّفات والرموز والكلمات الإنجليزية داخل النص العربي (عزل يونيكود)."),

  p("scramble", "ScrambleText", "motion", "ScrambleProvider, ScrambleText, useScramble, useScrambleSwitch", ["ScrambleExample"], "The language-switch scramble. The real text stays in the DOM; reduced motion switches at once.", "تشويش النص عند تبديل اللغة. يبقى النص الحقيقي في الصفحة؛ ومع تقليل الحركة يتم التبديل فورًا.", "motion"),
  p("reveal", "Reveal", "motion", "Reveal, useReveal", ["RevealExample"], "Rises into view once. Hidden only when JavaScript runs; a fade with reduced motion.", "يظهر صاعدًا مرة واحدة. لا يُخفى إلا مع جافاسكربت؛ ويصبح تلاشيًا مع تقليل الحركة.", "motion"),
  p("slash-reveal", "SlashReveal", "motion", "SlashReveal", ["SlashRevealExample"], "Media opens with a wipe at the angle of the % slash, in the reading direction. The angle never mirrors.", "تنفتح الوسائط بمسح بزاوية خط علامة %، في اتجاه القراءة. لا تنعكس الزاوية أبدًا.", "motion"),
  p("marquee", "Marquee", "motion", "Marquee", ["MarqueeExample"], "Endless row (client logos). Speeds up with scrolling, pauses on hover, stops with reduced motion.", "صف لا ينتهي (شعارات العملاء). يتسارع مع التمرير ويتوقف عند المرور ومع تقليل الحركة.", "motion"),
  p("logo-loader", "LogoLoader", "motion", "LogoLoader", ["LogoLoaderExample"], "The Portal loop: logo → Arabic → logo → English → logo, 7.2 s. The still icon with reduced motion; runs only on screen.", "حلقة البوابة: الشعار ← العربية ← الشعار ← الإنجليزية ← الشعار، 7.2 ث. الأيقونة ثابتة مع تقليل الحركة؛ تعمل على الشاشة فقط.", "motion"),
  p("magnetic", "Magnetic", "motion", "Magnetic, useMagnetic", ["MagneticExample"], "Primary buttons lean toward a nearby mouse. Not on touch, not with reduced motion.", "تميل الأزرار الأساسية نحو الفأرة القريبة. لا يعمل باللمس ولا مع تقليل الحركة.", "motion"),
  p("view-cursor", "ViewCursor", "motion", "ViewCursor", ["ViewCursorExample"], "A “View” circle over [data-cursor=\"view\"] links. Decoration only.", "دائرة «عرض» فوق روابط [data-cursor=\"view\"]. زخرفة فقط.", "motion"),
  p("play-once", "usePlayOnce", "motion", "usePlayOnce", ["PlayOnceExample"], "Plays a picture's CSS animation on view, hover and focus.", "يشغّل حركة الصورة عند الظهور والمرور والتركيز.", "motion"),
  p("counter", "Counter", "motion", "Counter, counterValue", ["CounterExample"], "Counts up when on screen. Screen readers and pages without JavaScript get the final number.", "يعدّ تصاعديًا عند الظهور. يحصل قارئ الشاشة والصفحات دون جافاسكربت على الرقم النهائي.", "motion"),
  p("scene-player", "ScenePlayer", "motion", "ScenePlayer", ["ScenePlayerExample"], "Play/pause and step dots for a looping scene. Required for large motion that plays with reduced motion.", "تشغيل وإيقاف ونقاط خطوات لمشهد متكرر. مطلوب للحركة الكبيرة التي تعمل مع تقليل الحركة.", "motion"),
  p("success-wipe", "useSuccessWipe", "motion", "useSuccessWipe", ["SuccessWipeExample"], "A band at the slash angle covers a form and leaves the success message behind it.", "شريط بزاوية الخط يغطي النموذج ويترك رسالة النجاح خلفه.", "motion"),

  p("visually-hidden", "VisuallyHidden", "utilities", "VisuallyHidden", ["VisuallyHiddenExample"], "Text for screen readers only.", "نص لقارئ الشاشة فقط."),
  p("live-region", "LiveRegion", "utilities", "LiveRegion", ["LiveRegionExample"], "Announces changes to screen readers.", "يعلن التغييرات لقارئ الشاشة."),
  p("media-query", "useMediaQuery, useReducedMotion", "utilities", "useMediaQuery, useReducedMotion", ["MediaQueryExample"], "Media queries in React; false on the server.", "استعلامات الوسائط في React؛ false على الخادم."),
  // Stage 2 (docs/stage2.md); each file holds the pages of one part.
  ...dataTables,
  ...dataItems,
  ...boards,
  ...code,
  ...charts,
  ...appShell,
  ...appForms,
  ...business,
  ...motionText,
  ...flip,
  ...motionCss,
];

/** Groups that have pages, in navigation order. */
export const GROUPS = GROUP_LIST.filter((g) => PAGES.some((x) => x.group === g.id));

export const findPage = (slug: string) => PAGES.find((x) => x.slug === slug);
