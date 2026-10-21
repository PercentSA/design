import { p, type DocPage } from "../page";

export const pages: DocPage[] = [
  p(
    "invoice",
    "Invoice",
    "business",
    "Invoice, invoiceTotals",
    ["InvoiceExample", "SimplifiedInvoiceExample"],
    "A Saudi tax invoice with Arabic and English labels on one page. Amounts are computed in halalas, with VAT rounded on each line, and it prints black on white in every theme.",
    "فاتورة ضريبية سعودية بعناوين عربية وإنجليزية في صفحة واحدة. تُحسب المبالغ بالهللات وتُقرَّب الضريبة في كل بند، وتُطبع بالأسود على الأبيض في كل سمة.",
  ),
  p(
    "qr-code",
    "QrCode",
    "business",
    "QrCode",
    ["QrCodeExample"],
    "A QR code drawn as SVG, black on white in every theme (many scanners cannot read a light code on a dark ground), with a quiet zone. Give it a name for screen readers.",
    "رمز استجابة سريعة مرسوم بصيغة SVG، أسود على أبيض في كل سمة (كثير من الماسحات لا تقرأ رمزًا فاتحًا على خلفية داكنة)، مع هامش فارغ حوله. أعطه اسمًا لقارئات الشاشة.",
  ),
  p(
    "zatca-qr",
    "ZatcaQr",
    "business",
    "ZatcaQr, zatcaTlv",
    ["ZatcaQrExample"],
    "The ZATCA QR code of a simplified tax invoice: seller, VAT number, time, total and VAT in TLV, base64 encoded. An empty seller, VAT number or time is an error. An Invoice with a QR code needs the real time of issue (timestamp).",
    "رمز الاستجابة السريعة لهيئة الزكاة والضريبة والجمارك في الفاتورة الضريبية المبسطة: البائع والرقم الضريبي والوقت والإجمالي والضريبة بصيغة TLV مرمّزة بـ base64. البائع أو الرقم الضريبي أو الوقت الفارغ خطأ. الفاتورة التي فيها رمز تحتاج إلى وقت الإصدار الفعلي (timestamp).",
  ),
  p(
    "ticket-view",
    "TicketView",
    "business",
    "TicketView",
    ["TicketViewExample"],
    "A support ticket: the conversation with internal notes and attachments, the reply form, and the ticket details beside it on wide screens.",
    "تذكرة دعم: المحادثة مع الملاحظات الداخلية والمرفقات، ونموذج الرد، وتفاصيل التذكرة بجانبها في الشاشات العريضة.",
  ),
];
