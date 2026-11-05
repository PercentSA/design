import { CodeBlock, Heading, Stack, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text, useLang, type Localized } from "@percentsa/ui";
import { Desc } from "./desc";

function useL() {
  const lang = useLang();
  return (v: Localized) => v[lang];
}

const YES: Localized = { en: "Yes", ar: "نعم" };
const NO: Localized = { en: "No", ar: "لا" };

// Part, in a server component, in a client component. Names in backticks render as code (Desc).
const WHERE: [Localized, Localized, Localized][] = [
  [
    { en: "Components (`Button`, `Money`, `Stack`, …)", ar: "المكونات (`Button` و`Money` و`Stack`…)" },
    { en: "Yes, with data props only", ar: "نعم، بخصائص من البيانات فقط" },
    YES,
  ],
  [
    { en: "Function props (`onClick`, `onValueChange`, `link`, `text`)", ar: "الخصائص التي هي دوال (`onClick` و`onValueChange` و`link` و`text`)" },
    NO,
    YES,
  ],
  [
    { en: "Functions and constants (`formatMoney`, `buttonClass`, `isVatNumber`, `THEME_SCRIPT`, …)", ar: "الدوال والثوابت (`formatMoney` و`buttonClass` و`isVatNumber` و`THEME_SCRIPT`…)" },
    YES,
    YES,
  ],
  [{ en: "Hooks (`useLang`, `useStrings`, `useTheme`, …)", ar: "الخطافات (`useLang` و`useStrings` و`useTheme`…)" }, NO, YES],
  [{ en: "`toast()`, `dismissToast()`", ar: "`toast()` و`dismissToast()`" }, NO, YES],
  [{ en: "`PercentProvider`", ar: "`PercentProvider`" }, { en: "Only in a client file of your app", ar: "داخل ملف عميل في تطبيقك فقط" }, YES],
];

const PROVIDERS = `"use client";
import NextLink from "next/link";
import { PercentProvider, Toaster, type Lang } from "@percentsa/ui";

export function Providers({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <PercentProvider lang={lang} link={({ href, ...p }) => <NextLink href={href!} {...p} />}>
      {children}
      <Toaster />
    </PercentProvider>
  );
}`;

const LAYOUT = `import { THEME_SCRIPT } from "@percentsa/ui";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // THEME_SCRIPT can change data-theme before React loads.
    <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers lang="ar">{children}</Providers>
      </body>
    </html>
  );
}`;

const PAGE = `import NextLink from "next/link";
import { Badge, buttonClass, Heading, isVatNumber, Money, Stack } from "@percentsa/ui";
import { getInvoice } from "@/lib/invoices";
import { PayButton } from "./pay-button";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const invoice = await getInvoice((await params).id);
  return (
    <Stack gap={4}>
      <Heading level={1}>{invoice.number}</Heading>
      <Money amount={invoice.total} />
      {!isVatNumber(invoice.vat) && <Badge>VAT number missing</Badge>}
      <NextLink href="/invoices" className={buttonClass("secondary")}>
        All invoices
      </NextLink>
      <PayButton invoiceId={invoice.id} />
    </Stack>
  );
}`;

const PAY_BUTTON = `"use client";
import { Button, toast } from "@percentsa/ui";

export function PayButton({ invoiceId }: { invoiceId: string }) {
  return (
    <Button
      onClick={async () => {
        await fetch(\`/api/invoices/\${invoiceId}/pay\`, { method: "POST" });
        toast({ title: "Paid", tone: "success" });
      }}
    >
      Pay
    </Button>
  );
}`;

export function ServerComponentsPage() {
  const l = useL();
  return (
    <Stack gap={10}>
      <Text tone="muted">
        <Desc
          text={l({
            en: "From 0.5.1, the packages work in React Server Components. Components with state, effects or events are client components: their files start with `\"use client\"`. Functions and constants are in files without it, so server code can call them. Every exported function and constant works on the server, except hooks, `toast()`, `dismissToast()` and `fieldContext`.",
            ar: "منذ الإصدار 0.5.1 تعمل الحزم مع مكونات خادم React. المكونات التي لها حالة أو تأثيرات أو أحداث هي مكونات عميل: تبدأ ملفاتها بالسطر `\"use client\"`. أما الدوال والثوابت ففي ملفات دونه، فيستطيع كود الخادم استدعاءها. كل الدوال والثوابت المصدّرة تعمل على الخادم، ما عدا الخطافات و`toast()` و`dismissToast()` و`fieldContext`.",
          })}
        />
      </Text>

      <Stack gap={4}>
        <Heading level={2}>{l({ en: "What runs where", ar: "ما الذي يعمل وأين" })}</Heading>
        <Table caption={l({ en: "Where each part works", ar: "أين يعمل كل جزء" })}>
          <TableHeader>
            <TableRow>
              <TableHead>{l({ en: "Part", ar: "الجزء" })}</TableHead>
              <TableHead>{l({ en: "In a server component", ar: "في مكون خادم" })}</TableHead>
              <TableHead>{l({ en: "In a client component", ar: "في مكون عميل" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WHERE.map(([part, server, client], i) => (
              <TableRow key={i}>
                <TableCell>
                  <Desc text={l(part)} />
                </TableCell>
                <TableCell>{l(server)}</TableCell>
                <TableCell>{l(client)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>

      <Stack gap={4}>
        <Heading level={2}>{l({ en: "Set up the provider", ar: "إعداد المزوّد" })}</Heading>
        <Text tone="muted">
          <Desc
            text={l({
              en: "`PercentProvider` takes functions (`link`, `text`), and a server component cannot pass functions. Put the provider in a client file of your app, and use that file in the root layout. `THEME_SCRIPT` is a string, so the layout can put it in `<head>`.",
              ar: "يأخذ `PercentProvider` دوال (`link` و`text`)، ولا يستطيع مكون الخادم تمرير الدوال. ضع المزوّد في ملف عميل داخل تطبيقك، واستخدم هذا الملف في التخطيط الجذري. القيمة `THEME_SCRIPT` نص، فيستطيع التخطيط وضعها في `<head>`.",
            })}
          />
        </Text>
        <CodeBlock code={PROVIDERS} filename="app/providers.tsx" />
        <CodeBlock code={LAYOUT} filename="app/layout.tsx" />
      </Stack>

      <Stack gap={4}>
        <Heading level={2}>{l({ en: "A server page", ar: "صفحة خادم" })}</Heading>
        <Text tone="muted">
          <Desc
            text={l({
              en: "The page reads its data on the server and renders the components. Client components in it, such as `Money` and `Button`, also render on the server first; then the browser loads their code.",
              ar: "تقرأ الصفحة بياناتها على الخادم وتعرض المكونات. مكونات العميل فيها، مثل `Money` و`Button`، تُعرض على الخادم أولًا أيضًا، ثم يحمّل المتصفح كودها.",
            })}
          />
        </Text>
        <CodeBlock code={PAGE} filename="app/invoices/[id]/page.tsx" />
      </Stack>

      <Stack gap={4}>
        <Heading level={2}>{l({ en: "Events", ar: "الأحداث" })}</Heading>
        <Text tone="muted">
          <Desc
            text={l({
              en: "A server component cannot pass `onClick`. Put the event in a small client component, and give it only data (here, the invoice id).",
              ar: "لا يستطيع مكون الخادم تمرير `onClick`. ضع الحدث في مكون عميل صغير، ومرّر إليه بيانات فقط (هنا رقم الفاتورة).",
            })}
          />
        </Text>
        <CodeBlock code={PAY_BUTTON} filename="app/invoices/[id]/pay-button.tsx" />
      </Stack>

      <Text size="sm" tone="subtle">
        <Desc
          text={l({
            en: "With Cache Components on (`cacheComponents` in `next.config`), a part that reads the current time or the URL must be inside `<Suspense>`: `TimeText`, and a provider file that reads `useSearchParams()` for `location`. These parts then show after the page loads.",
            ar: "عند تفعيل Cache Components (`cacheComponents` في `next.config`) يجب أن يكون كل جزء يقرأ الوقت الحالي أو الرابط داخل `<Suspense>`: `TimeText`، وملف الموفّر الذي يقرأ `useSearchParams()` من أجل `location`. تظهر هذه الأجزاء بعد تحميل الصفحة.",
          })}
        />
      </Text>

      <Text size="sm" tone="subtle">
        <Desc
          text={l({
            en: "Apps without server components (React Router, Vite) need no change: the `\"use client\"` lines have no effect there.",
            ar: "التطبيقات التي لا تستخدم مكونات الخادم (React Router وVite) لا تحتاج إلى أي تغيير: لا أثر لأسطر `\"use client\"` فيها.",
          })}
        />
      </Text>
    </Stack>
  );
}
