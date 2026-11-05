import { useEffect, useState } from "react";
import { FileText, Globe, LayoutDashboard, Plus, Receipt, Smartphone } from "lucide-react";
import { Badge, Button, Card, ColumnsMenu, CopyButton, DataTable, type DataTableColumn, type DataTableSort, DescriptionList, EmptyState, formatDate, Grid, List, ListItem, Money, PhoneText, RiyalSign, StatusDot, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text, toast, useLang } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function CardExample() {
  const t = useT();
  return (
    <Grid min="14rem" gap={4} className="w-full">
      <Card
        title={t("Masar", "مسار")}
        description={t("Booking app for clinics", "تطبيق حجوزات للعيادات")}
        action={<Badge>{t("Mobile", "جوال")}</Badge>}
        footer={<StatusDot status="live">{t("Live", "يعمل")}</StatusDot>}
      >
        <Text size="sm" tone="muted">{t("12,400 bookings in the first month.", "12,400 حجز في الشهر الأول.")}</Text>
      </Card>
      <Card
        href="#"
        title={t("Sadeem dashboard", "لوحة سديم")}
        description={t("The whole card is one link. The copy button still works.", "البطاقة كلها رابط واحد. وزر النسخ يعمل أيضًا.")}
        action={<CopyButton value="https://percent.sa" iconOnly />}
        footer={t("Updated 2 days ago", "حُدّثت قبل يومين")}
      />
    </Grid>
  );
}

/** A form table: `scope="row"` for the line labels (the look of a body cell), `wrap` for long column titles. */
export function TableRowHeadersExample() {
  const t = useT();
  const lines = [
    { label: t("Standard rated sales", "المبيعات الخاضعة للنسبة الأساسية"), base: 120000, vat: 18000 },
    { label: t("Zero rated sales", "المبيعات الخاضعة لنسبة الصفر"), base: 30000, vat: 0 },
  ];
  return (
    <Table caption={t("VAT return", "الإقرار الضريبي")} className="max-w-lg">
      <TableHeader>
        <TableRow>
          <TableHead>{t("Line", "البند")}</TableHead>
          <TableHead wrap align="end">{t("Amount (", "المبلغ (")}<RiyalSign />)</TableHead>
          <TableHead wrap align="end">{t("VAT amount (", "مبلغ الضريبة (")}<RiyalSign />)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((l) => (
          <TableRow key={l.label}>
            <TableHead scope="row">{l.label}</TableHead>
            <TableCell align="end">
              <Money amount={l.base} />
            </TableCell>
            <TableCell align="end">
              <Money amount={l.vat} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TableExample() {
  const t = useT();
  const lines = [
    { item: t("Design sprint", "مرحلة التصميم"), qty: 1, amount: 18000 },
    { item: t("Development (hours)", "التطوير (ساعات)"), qty: 120, amount: 54000 },
    { item: t("Hosting (1 year)", "الاستضافة (سنة)"), qty: 1, amount: 2400 },
  ];
  return (
    <Table caption={t("Invoice lines", "بنود الفاتورة")} className="max-w-lg">
      <TableHeader>
        <TableRow>
          <TableHead>{t("Item", "البند")}</TableHead>
          <TableHead align="end">{t("Quantity", "الكمية")}</TableHead>
          <TableHead align="end">{t("Amount", "المبلغ")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((l) => (
          <TableRow key={l.item}>
            <TableCell>{l.item}</TableCell>
            <TableCell align="end">{l.qty}</TableCell>
            <TableCell align="end">
              <Money amount={l.amount} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type Invoice = { id: string; client: readonly [string, string]; status: "paid" | "due" | "overdue"; amount: number };

const CLIENTS = [
  ["Masar", "مسار"],
  ["Nakhla Foods", "نخلة للأغذية"],
  ["Raha Clinics", "عيادات راحة"],
  ["Sadeem", "سديم"],
  ["Wadi Tech", "وادي التقنية"],
  ["Bayt Coffee", "قهوة بيت"],
  ["Najm Logistics", "نجم للخدمات اللوجستية"],
] as const;
const STATUSES = ["paid", "due", "overdue"] as const;
const INVOICES: Invoice[] = Array.from({ length: 23 }, (_, i) => ({
  id: `INV-${1040 + i}`,
  client: CLIENTS[i % CLIENTS.length]!,
  status: STATUSES[(i * 5) % 3]!,
  amount: 1500 + ((i * 7919) % 40) * 250,
}));

function useInvoiceColumns(): DataTableColumn<Invoice>[] {
  const t = useT();
  const lang = useLang();
  const status = { paid: t("Paid", "مدفوعة"), due: t("Due", "مستحقة"), overdue: t("Overdue", "متأخرة") };
  const client = (r: Invoice) => r.client[lang === "ar" ? 1 : 0];
  return [
    { key: "id", header: t("Invoice", "الفاتورة"), sortable: true, cell: (r) => <span dir="ltr" className="font-mono text-xs">{r.id}</span> },
    { key: "client", header: t("Client", "العميل"), sortable: true, cell: client, sortValue: client },
    { key: "status", header: t("Status", "الحالة"), cell: (r) => <Badge variant={r.status === "overdue" ? "solid" : r.status === "due" ? "outline" : "subtle"}>{status[r.status]}</Badge> },
    { key: "amount", header: t("Amount", "المبلغ"), sortable: true, align: "end", cell: (r) => <Money amount={r.amount} /> },
  ];
}

export function DataTableExample() {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="grid w-full grid-cols-1 gap-3">
      <DataTable
        columns={useInvoiceColumns()}
        rows={INVOICES}
        getRowId={(r) => r.id}
        caption={t("Invoices", "الفواتير")}
        hideCaption
        defaultSort={{ key: "id", direction: "desc" }}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        pageSize={5}
      />
      {selected.length > 0 && (
        <Button size="sm" variant="secondary" className="justify-self-start" onClick={() => setSelected([])}>
          {t("Clear selection", "إلغاء التحديد")}
        </Button>
      )}
    </div>
  );
}

/** A list: each row opens its invoice, "⋯" holds the row actions, and below 768 px the rows are cards. */
export function DataTableListExample() {
  const t = useT();
  const done = (title: string) => () => toast({ title });
  return (
    <DataTable
      className="w-full"
      columns={useInvoiceColumns()}
      rows={INVOICES}
      getRowId={(r) => r.id}
      caption={t("Invoices", "الفواتير")}
      hideCaption
      selectable
      pageSize={5}
      cards
      rowHref={(r) => `#${r.id}`}
      rowActions={(r) => [
        { label: t("Duplicate", "تكرار"), onSelect: done(t("Invoice duplicated", "كُرّرت الفاتورة")) },
        {
          label: t("Send a reminder", "إرسال تذكير"),
          disabled: r.status === "paid",
          description: r.status === "paid" ? t("This invoice is paid.", "هذه الفاتورة مدفوعة.") : undefined,
          onSelect: done(t("Reminder sent", "أُرسل التذكير")),
        },
        "separator",
        { label: t("Delete", "حذف"), danger: true, onSelect: done(t("Invoice deleted", "حُذفت الفاتورة")) },
      ]}
    />
  );
}

/** A report: the invoices grouped by status (sorted inside each group), a subtotal per group and a total row. */
export function DataTableReportExample() {
  const t = useT();
  const status = { paid: t("Paid", "مدفوعة"), due: t("Due", "مستحقة"), overdue: t("Overdue", "متأخرة") };
  const sum = (rows: Invoice[]) => <Money amount={rows.reduce((n, r) => n + r.amount, 0)} />;
  const rows = INVOICES.slice(0, 10);
  return (
    <DataTable
      className="w-full"
      columns={useInvoiceColumns().filter((c) => c.key !== "status")}
      rows={rows}
      getRowId={(r) => r.id}
      caption={t("Invoices by status", "الفواتير حسب الحالة")}
      hideCaption
      defaultSort={{ key: "amount", direction: "desc" }}
      groupBy={(r) => r.status}
      groupHeader={(key, group) => `${status[key as Invoice["status"]]} (${group.length})`}
      groupTotals={(_, group) => ({ amount: sum(group) })}
      totals={{ amount: sum(rows) }}
    />
  );
}

/** A print copy: small cells, wrapping headers, no scroll box, no cards. The caller leaves out pages and row links. */
export function DataTablePrintExample() {
  const t = useT();
  const status = { paid: t("Paid", "مدفوعة"), due: t("Due", "مستحقة"), overdue: t("Overdue", "متأخرة") };
  const sum = (rows: Invoice[]) => <Money amount={rows.reduce((n, r) => n + r.amount, 0)} />;
  const rows = INVOICES.slice(0, 8);
  return (
    <DataTable
      className="w-full"
      density="print"
      columns={useInvoiceColumns().map((c) => (c.key === "amount" ? { ...c, header: <>{t("Amount including VAT (", "المبلغ شاملًا الضريبة (")}<RiyalSign />)</> } : c))}
      rows={rows}
      getRowId={(r) => r.id}
      caption={t("Tax documents", "المستندات الضريبية")}
      groupBy={(r) => r.status}
      groupHeader={(key, group) => `${status[key as Invoice["status"]]} (${group.length})`}
      groupTotals={(_, group) => ({ amount: sum(group) })}
      totals={{ amount: sum(rows) }}
    />
  );
}

/** ColumnsMenu hides columns (Invoice stays), with a rows-per-page choice and a header that stays in view. */
export function ColumnsMenuExample() {
  const t = useT();
  const columns = useInvoiceColumns().map((c) => (c.key === "id" ? { ...c, hideable: false } : c));
  const [hidden, setHidden] = useState<string[]>([]);
  const [size, setSize] = useState(10);
  return (
    <div className="grid w-full grid-cols-1 gap-3">
      <ColumnsMenu className="justify-self-end" columns={columns} hidden={hidden} onHiddenChange={setHidden} />
      <DataTable
        columns={columns}
        rows={INVOICES}
        getRowId={(r) => r.id}
        caption={t("Invoices", "الفواتير")}
        hideCaption
        hiddenColumns={hidden}
        pageSize={size}
        pageSizeOptions={[5, 10, 25]}
        onPageSizeChange={setSize}
        stickyHeader
      />
    </div>
  );
}

const PAGE_SIZE = 5;

// Stands in for the server: it sorts and slices, and the table shows the rows as given.
function fetchInvoices(sort: DataTableSort, page: number) {
  const sign = sort.direction === "asc" ? 1 : -1;
  const sorted = [...INVOICES].sort((a, b) => sign * (sort.key === "amount" ? a.amount - b.amount : a.id.localeCompare(b.id)));
  return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export function DataTableServerExample() {
  const t = useT();
  const columns = useInvoiceColumns().map((c) => (c.key === "client" ? { ...c, sortable: false } : c));
  const [query, setQuery] = useState<{ sort: DataTableSort; page: number }>({ sort: { key: "id", direction: "asc" }, page: 1 });
  const [loading, setLoading] = useState(true);
  // A pretend request: 600 ms of loading after each sort or page change.
  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, [query]);
  return (
    <DataTable
      className="w-full"
      columns={columns}
      rows={fetchInvoices(query.sort, query.page)}
      getRowId={(r) => r.id}
      caption={t("Invoices", "الفواتير")}
      hideCaption
      sort={query.sort}
      onSortChange={(sort) => setQuery({ sort, page: 1 })}
      page={query.page}
      pageCount={Math.ceil(INVOICES.length / PAGE_SIZE)}
      onPageChange={(page) => setQuery({ ...query, page })}
      loading={loading}
    />
  );
}

export function DataTableEmptyExample() {
  const t = useT();
  return (
    <DataTable
      className="w-full"
      columns={useInvoiceColumns()}
      rows={[]}
      getRowId={(r) => r.id}
      caption={t("Invoices", "الفواتير")}
      hideCaption
      empty={
        <EmptyState
          className="border-0"
          icon={<Receipt aria-hidden />}
          title={t("No invoices yet", "لا توجد فواتير بعد")}
          description={t("Invoices you send appear here.", "تظهر هنا الفواتير التي ترسلها.")}
          action={
            <Button size="sm">
              <Plus aria-hidden />
              {t("New invoice", "فاتورة جديدة")}
            </Button>
          }
        />
      }
    />
  );
}

export function ListExample() {
  const t = useT();
  return (
    <List className="w-full max-w-md">
      <ListItem
        href="#"
        leading={<Smartphone aria-hidden />}
        title={t("Masar", "مسار")}
        description={t("Booking app · 2026", "تطبيق حجوزات · 2026")}
        trailing={<StatusDot status="live">{t("Live", "يعمل")}</StatusDot>}
      />
      <ListItem
        href="#"
        leading={<LayoutDashboard aria-hidden />}
        title={t("Sadeem", "سديم")}
        description={t("Operations dashboard · 2025", "لوحة عمليات · 2025")}
        trailing={<Money amount={180000} />}
      />
      <ListItem
        leading={<Globe aria-hidden />}
        title={t("Bayt Coffee", "قهوة بيت")}
        description={t("Online store · in progress", "متجر إلكتروني · قيد التنفيذ")}
        trailing={<Button size="sm" variant="ghost">{t("Open", "فتح")}</Button>}
      />
      <ListItem leading={<FileText aria-hidden />} title={t("Project proposal", "عرض المشروع")} description={<span dir="ltr">PDF · 2.4 MB</span>} />
    </List>
  );
}

export function DescriptionListExample() {
  const t = useT();
  const lang = useLang();
  return (
    <DescriptionList
      className="w-full max-w-lg"
      layout="columns"
      items={[
        { term: t("Client", "العميل"), details: t("Masar", "مسار") },
        { term: t("Services", "الخدمات"), details: t("Product design, mobile app, hosting", "تصميم المنتج، تطبيق جوال، استضافة") },
        { term: t("Start date", "تاريخ البدء"), details: formatDate(new Date("2026-03-01T00:00:00+03:00"), { lang }) },
        { term: t("Budget", "الميزانية"), details: <Money amount={240000} /> },
        { term: t("Status", "الحالة"), details: <StatusDot status="live">{t("Live", "يعمل")}</StatusDot> },
      ]}
    />
  );
}

export function DescriptionListAutoExample() {
  const t = useT();
  const items = [
    { term: t("Client", "العميل"), details: t("Masar", "مسار") },
    { term: t("Services", "الخدمات"), details: t("Product design, mobile app, hosting", "تصميم المنتج، تطبيق جوال، استضافة") },
    { term: t("Budget", "الميزانية"), details: <Money amount={240000} /> },
  ];
  return (
    <div className="grid w-full gap-6 sm:grid-cols-[16rem_1fr]">
      <DescriptionList layout="auto" density="compact" items={items} />
      <DescriptionList layout="auto" density="compact" items={items} />
    </div>
  );
}

export function CardCompactExample() {
  const t = useT();
  return (
    <Grid min="14rem" gap={4} className="w-full">
      <Card title={t("Default", "افتراضي")} description={t("p-6, title text-lg.", "حشوة p-6، والعنوان text-lg.")}>
        <Text size="sm" tone="muted">{t("The usual card.", "البطاقة المعتادة.")}</Text>
      </Card>
      <Card density="compact" title={t("Compact", "مضغوط")} description={t("p-4, title text-base.", "حشوة p-4، والعنوان text-base.")}>
        <Text size="sm" tone="muted">{t("For dense records.", "للسجلات الكثيفة.")}</Text>
      </Card>
    </Grid>
  );
}

/** A dense list: `density="compact"`, a muted line under the customer (a phone, with a link in it), and the card slots below 768 px. */
export function DataTableDenseExample() {
  const t = useT();
  type Order = { id: string; number: string; name: string; phone: string; total: number; comment: string };
  const rows: Order[] = [
    { id: "1", number: "INV-1042", name: t("Sara Al-Qahtani", "سارة القحطاني"), phone: "0551234567", total: 1850, comment: t("Deliver after 5 pm. Call before arriving.", "التسليم بعد الخامسة مساءً. الاتصال قبل الوصول.") },
    { id: "2", number: "INV-1043", name: t("Omar Al-Harbi", "عمر الحربي"), phone: "0507654321", total: 320, comment: "" },
    { id: "3", number: "INV-1044", name: t("Lina Al-Otaibi", "لينا العتيبي"), phone: "0561112233", total: 12400, comment: t("Gift wrap.", "تغليف هدية.") },
  ];
  const columns: DataTableColumn<Order>[] = [
    // The first cell is the row link; the description comes after it, and the phone stays a working link.
    { key: "name", header: t("Customer", "العميل"), description: (r) => <PhoneText value={r.phone} /> },
    { key: "number", header: t("Invoice", "الفاتورة"), description: () => t("Simplified tax invoice", "فاتورة ضريبية مبسطة"), cardSlot: "meta" },
    { key: "total", header: t("Total", "المجموع"), cell: (r) => <Money amount={r.total} />, align: "end", cardSlot: "end" },
    { key: "comment", header: t("Comment", "ملاحظة"), cardSlot: "block", hideable: false },
  ];
  return <DataTable className="w-full" density="compact" cards columns={columns} rows={rows} getRowId={(r) => r.id} caption={t("Orders", "الطلبات")} hideCaption rowHref={(r) => `#${r.id}`} />;
}
