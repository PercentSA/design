import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { dirOf } from "../i18n/localized";
import { STRINGS, type Strings } from "../i18n/strings";
import { useLang, useStrings } from "../provider";
import { fromPlain, type PlainDate } from "../saudi/calendar";
import { formatDate } from "../saudi/date";
import { invoiceTotals, zatcaTlv } from "../saudi/invoice";
import { Money } from "../saudi/money";
import { QrCode } from "./qr-code";
import { formatNumber } from "./text";

export type InvoiceParty = { name: string; vatNumber?: string; crNumber?: string; address?: ReactNode };
export type InvoiceLine = { description: ReactNode; quantity: number; unitPrice: number; vatRate?: number };

type Key = keyof Strings["invoice"];

/** `qr` shows the ZATCA QR code of the totals; it needs the real time of issue (ISO 8601) and the seller's VAT number. */
type InvoiceQr =
  | { qr: true; timestamp: string; seller: InvoiceParty & { vatNumber: string } }
  | { qr?: false; timestamp?: undefined; seller: InvoiceParty };

// White paper in every theme: inside the invoice the theme tokens become black on white.
const PRINT =
  "print:rounded-none print:border-0 print:p-0 print:bg-white print:text-black print:shadow-none print:[--p-bg:#fff] print:[--p-surface:#fff] print:[--p-surface-2:#fff] print:[--p-line:#bbb] print:[--p-line-strong:#666] print:[--p-fg:#000] print:[--p-fg-2:#000] print:[--p-fg-3:#444]";

/** A label in both languages: the page language first, the other one beside it (or under it when `stacked`). */
function Bi({ k, stacked }: { k: Key; stacked?: boolean }) {
  const own = useStrings().invoice[k];
  const other = useLang() === "ar" ? "en" : "ar";
  return (
    <>
      {own}
      {stacked ? <br /> : <span aria-hidden="true" className="px-1.5 text-line-strong">|</span>}
      <span lang={other} dir={dirOf(other)} className={stacked ? "text-fg-3" : undefined}>
        {STRINGS[other].invoice[k]}
      </span>
    </>
  );
}

function Party({ title, party, H }: { title: Key; party: InvoiceParty; H: "h3" | "h4" | "h5" | "h6" }) {
  const fields: [Key, ReactNode][] = [
    ["vatNumber", party.vatNumber && <span className="tabular-nums">{party.vatNumber}</span>],
    ["crNumber", party.crNumber && <span className="tabular-nums">{party.crNumber}</span>],
    ["address", party.address],
  ];
  return (
    <div>
      <H className="text-xs font-medium text-fg-3">
        <Bi k={title} />
      </H>
      <p className="mt-2 font-medium">{party.name}</p>
      <dl className="mt-2 grid gap-1.5 text-sm">
        {fields.map(
          ([k, v]) =>
            v && (
              <div key={k} className="flex flex-wrap gap-x-2">
                <dt className="text-fg-3">
                  <Bi k={k} />
                </dt>
                <dd className="text-fg-2">{v}</dd>
              </div>
            ),
        )}
      </dl>
    </div>
  );
}

const COLUMNS: [Key, boolean][] = [
  ["description", false],
  ["quantity", true],
  ["unitPrice", true],
  ["vatRate", true],
  ["vatAmount", true],
  ["lineTotal", true],
];

/**
 * A Saudi tax invoice: labels in Arabic and English on one page, amounts computed in halalas,
 * and the ZATCA QR code (`qr`). Prints black on white in every theme.
 */
export function Invoice({
  type,
  number,
  issueDate,
  seller,
  buyer,
  lines,
  notes,
  showHijri,
  qr,
  timestamp,
  headingLevel = 2,
  className,
}: InvoiceQr & {
  /** "simplified" for sales to consumers (B2C), "standard" for businesses (B2B). */
  type: "standard" | "simplified";
  number: string;
  issueDate: PlainDate;
  buyer?: InvoiceParty;
  lines: InvoiceLine[];
  notes?: ReactNode;
  showHijri?: boolean;
  /** Level of the invoice title; the seller, buyer and notes headings are one level lower. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  const Sub = `h${Math.min(headingLevel + 1, 6) as 3 | 4 | 5 | 6}` as const;
  const lang = useLang();
  const s = useStrings().invoice;
  const id = useId();
  const totals = invoiceTotals(lines);
  const day = fromPlain(issueDate);
  const rate = (r = 0.15) => `${Math.round(r * 10_000) / 100}%`;
  let qrValue: string | undefined;
  // Bad QR data (no VAT number, a field over 255 bytes) must not take the whole page down: log it and leave the QR out.
  if (qr) {
    try {
      qrValue = zatcaTlv({ seller: seller.name, vatNumber: seller.vatNumber ?? "", timestamp, total: totals.total, vat: totals.vat });
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <article aria-labelledby={id} className={cn("@container rounded-card border border-line bg-bg p-6 text-fg sm:p-8", PRINT, className)}>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div className="grid gap-5">
          <H id={id} className="heading text-2xl">
            <Bi k={type === "simplified" ? "simplifiedTaxInvoice" : "taxInvoice"} stacked />
          </H>
          <dl className="grid gap-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-fg-3">
                <Bi k="number" />
              </dt>
              <dd>
                <span dir="ltr" className="font-mono">
                  {number}
                </span>
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-fg-3">
                <Bi k="issueDate" />
              </dt>
              <dd>
                {formatDate(day, { lang })}
                {showHijri && <span className="text-fg-3"> · {formatDate(day, { lang, calendar: "hijri" })}</span>}
              </dd>
            </div>
          </dl>
        </div>
        {qrValue && <QrCode value={qrValue} label={s.qr} size={112} />}
      </header>

      <div className="grid gap-6 border-b border-line py-6 @lg:grid-cols-2">
        <Party title="seller" party={seller} H={Sub} />
        {buyer && <Party title="buyer" party={buyer} H={Sub} />}
      </div>

      <div className="overflow-x-auto py-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-strong text-xs">
              {COLUMNS.map(([k, end]) => (
                <th key={k} scope="col" className={cn("px-2 pb-2 align-bottom font-medium first:ps-0 last:pe-0", end ? "text-end" : "text-start")}>
                  <Bi k={k} stacked />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const t = totals.lines[i]!;
              return (
                <tr key={i} className="border-b border-line align-top">
                  <td className="py-3 pe-2">{line.description}</td>
                  <td className="px-2 py-3 text-end tabular-nums">{formatNumber(line.quantity, lang)}</td>
                  <td className="px-2 py-3 text-end">
                    <Money amount={line.unitPrice} decimals={2} />
                  </td>
                  <td className="px-2 py-3 text-end tabular-nums">
                    <span dir="ltr">{rate(line.vatRate)}</span>
                  </td>
                  <td className="px-2 py-3 text-end">
                    <Money amount={t.vat} decimals={2} />
                  </td>
                  <td className="py-3 ps-2 text-end">
                    <Money amount={t.total} decimals={2} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="ms-auto grid max-w-sm gap-3 text-sm">
        {(
          [
            ["subtotal", totals.subtotal],
            ["totalVat", totals.vat],
            ["total", totals.total],
          ] as const
        ).map(([k, amount]) => (
          <div key={k} className={cn("flex items-end justify-between gap-6", k === "total" ? "border-t border-line-strong pt-3 text-base font-semibold" : "text-fg-2")}>
            <dt className="text-xs font-normal text-fg-3">
              <Bi k={k} stacked />
            </dt>
            <dd className={k === "total" ? "text-fg" : undefined}>
              <Money amount={amount} decimals={2} />
            </dd>
          </div>
        ))}
      </dl>

      {notes && (
        <div className="mt-6 border-t border-line pt-6">
          <Sub className="text-xs font-medium text-fg-3">
            <Bi k="notes" />
          </Sub>
          <div className="mt-2 text-sm text-fg-2">{notes}</div>
        </div>
      )}
    </article>
  );
}
