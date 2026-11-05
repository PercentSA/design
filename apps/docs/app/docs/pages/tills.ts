import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "action-bar",
    "ActionBar",
    "app",
    "ActionBar, type ActionBarItem",
    ["ActionBarExample", "ActionBarOverflowExample"],
    "The bottom bar of a work tool such as a till, a kiosk or a picking tool: equal tiles with an icon (20 px), a label cut with the full text in `title`, and a key hint (a left-to-right `Kbd`, such as F2, hidden on a touch screen). The bar only shows the hints: the app binds the keys. Tiles are 56 px high (64 px in `data-density=\"touch\"`); when any item has a `keyHint`, all tiles are 72 px high on a mouse so the key keeps clear of the edge and the label (on a touch screen the hints are hidden and the heights above apply). `tone: \"danger\"` gives red text and border; `disabled` keeps the tile in its place. `group: \"end\"` puts an item after a separator at the end side, and it never goes into the overflow. When a tile would be narrower than 5rem, the last main items move into a “More” menu (label and key hint per row). It is a `nav` named by `label`; Tab moves between the tiles. No items: nothing renders. The order follows the reading direction. For buttons in a row use `ButtonGroup`; for one keyboard key use `Kbd`.",
    "الشريط السفلي لأداة عمل مثل صندوق بيع أو كشك أو أداة تجهيز: بلاطات متساوية بأيقونة (20 بكسل) وعنوان يُقطع والنص الكامل في `title` وتلميح مفتاح (`Kbd` من اليسار إلى اليمين مثل F2، يختفي على شاشة اللمس). يعرض الشريط التلميحات فقط، والتطبيق هو من يربط المفاتيح. ارتفاع البلاطة 56 بكسل (64 في `data-density=\"touch\"`)؛ وإذا كان لأي عنصر `keyHint` صارت كل البلاطات بارتفاع 72 بكسل مع الفأرة ليبقى المفتاح بعيدًا عن الحافة والعنوان (وعلى شاشة اللمس تختفي التلميحات وتسري الارتفاعات أعلاه). تعطي `tone: \"danger\"` نصًا وإطارًا أحمرين؛ ويُبقي `disabled` البلاطة في مكانها. يضع `group: \"end\"` العنصر بعد فاصل في جهة النهاية ولا يدخل القائمة الفائضة أبدًا. حين تصبح بلاطة أضيق من 5rem تنتقل آخر العناصر الرئيسية إلى قائمة «المزيد» (العنوان وتلميح المفتاح في كل صف). هو `nav` اسمه من `label`؛ وينقل Tab بين البلاطات. بلا عناصر: لا يُعرض شيء. يتبع الترتيب اتجاه القراءة. لأزرار في صف استخدم `ButtonGroup`؛ ولمفتاح لوحة مفاتيح واحد استخدم `Kbd`.",
  ),
  p(
    "keypad",
    "Keypad",
    "app",
    "Keypad",
    ["KeypadExample", "KeypadPinExample"],
    "Digit keys on a touch screen for an amount or a code, so the system keyboard does not cover a dialog. `value` is the draft text of the field it serves (Western digits and “.”, as `MoneyInput`) and `onValueChange` gets the next draft. `mode=\"amount\"` has 1 to 9, “.”, 0, “00” and a backspace key; a leading zero is replaced by the next digit, a second “.” is refused, and `decimals` (default 2) is the most digits after it (0 hides the “.” key). `mode=\"pin\"` has 1 to 9, 0 and backspace. At `maxLength` the digit keys do nothing. The keys are buttons with names in both languages and stay left to right in Arabic, like a phone. A hardware keyboard works too (digits, “.” and Backspace) while the focus is on the page or inside the keypad, and never when a text field, dialog or menu has the focus, on a key repeat, or with Ctrl, Meta or Alt. Use it on a coarse pointer only; a desktop uses the keyboard. `PinPad` (a masked code with checking) uses the same key grid.",
    "مفاتيح أرقام على شاشة اللمس لمبلغ أو رمز، حتى لا تغطي لوحة المفاتيح الخاصة بالنظام النافذة. `value` هو نص المسودة للحقل الذي تخدمه (أرقام غربية و«.» كما في `MoneyInput`) وتتلقى `onValueChange` المسودة التالية. يضم `mode=\"amount\"` المفاتيح 1 إلى 9 و«.» و0 و«00» ومفتاح حذف؛ ويُستبدل الصفر الأول بالرقم التالي، وتُرفض «.» الثانية، وتحدد `decimals` (الافتراضي 2) أكثر عدد من الأرقام بعدها (0 يخفي مفتاح «.»). ويضم `mode=\"pin\"` المفاتيح 1 إلى 9 و0 والحذف. عند `maxLength` لا تفعل مفاتيح الأرقام شيئًا. المفاتيح أزرار بأسماء بالعربية والإنجليزية وتبقى من اليسار إلى اليمين في العربية كهاتف. تعمل لوحة المفاتيح الفعلية أيضًا (الأرقام و«.» وBackspace) ما دام التركيز على الصفحة أو داخل اللوحة، ولا تعمل حين يكون التركيز في حقل نصي أو نافذة أو قائمة، ولا مع تكرار المفتاح، ولا مع Ctrl أو Meta أو Alt. استخدمها على المؤشر الخشن فقط؛ فسطح المكتب يستخدم لوحة المفاتيح. تستخدم `PinPad` (رمز مقنّع مع تحقق) شبكة المفاتيح نفسها.",
  ),
];
