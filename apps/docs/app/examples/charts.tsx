import { AreaChart, BarChart, ChartLegend, DonutChart, formatNumber, LineChart, Sparkline, useLang } from "@percentsa/ui";
import { useT } from "~/lib/t";

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
};

export function LineChartExample() {
  const t = useT();
  const orders = [420, 510, 480, 620, 700, 810];
  const returns = [40, 52, 38, 61, 55, 49];
  return (
    <LineChart
      className="w-full"
      title={t("Orders and returns by month", "الطلبات والمرتجعات حسب الشهر")}
      data={MONTHS[useLang()].map((month, i) => ({ month, orders: orders[i]!, returns: returns[i]! }))}
      x="month"
      xLabel={t("Month", "الشهر")}
      series={[
        { key: "orders", label: t("Orders", "الطلبات") },
        { key: "returns", label: t("Returns", "المرتجعات") },
      ]}
      curve="monotone"
      markers
    />
  );
}

export function AreaChartExample() {
  const t = useT();
  const lang = useLang();
  const web = [1200, 1500, 1400, 1900, 2300, 2600];
  const app = [800, 900, 1300, 1500, 1700, 2100];
  const store = [300, 350, 320, 400, 380, 450];
  return (
    <AreaChart
      className="w-full"
      title={t("Visits by channel", "الزيارات حسب القناة")}
      data={MONTHS[lang].map((month, i) => ({ month, web: web[i]!, app: app[i]!, store: store[i]! }))}
      x="month"
      xLabel={t("Month", "الشهر")}
      series={[
        { key: "web", label: t("Website", "الموقع") },
        { key: "app", label: t("App", "التطبيق") },
        { key: "store", label: t("Store", "المتجر") },
      ]}
      curve="monotone"
      stacked
    />
  );
}

export function BarChartExample() {
  const t = useT();
  const plan = [120, 140, 160, 180];
  const actual = [110, 150, 155, 190];
  return (
    <BarChart
      className="w-full"
      title={t("Signed contracts: plan and actual", "العقود الموقعة: المخطط والفعلي")}
      data={[1, 2, 3, 4].map((n, i) => ({ q: t(`Q${n}`, `الربع ${n}`), plan: plan[i]!, actual: actual[i]! }))}
      x="q"
      xLabel={t("Quarter", "الربع")}
      series={[
        { key: "actual", label: t("Actual", "الفعلي") },
        { key: "plan", label: t("Plan", "المخطط") },
      ]}
    />
  );
}

export function BarChartHorizontalExample() {
  const t = useT();
  return (
    <BarChart
      className="w-full"
      layout="horizontal"
      stacked
      title={t("Open tickets by city", "التذاكر المفتوحة حسب المدينة")}
      data={[
        { city: t("Riyadh", "الرياض"), new: 24, waiting: 12 },
        { city: t("Jeddah", "جدة"), new: 18, waiting: 9 },
        { city: t("Dammam", "الدمام"), new: 11, waiting: 7 },
        { city: t("Makkah", "مكة"), new: 8, waiting: 3 },
      ]}
      x="city"
      xLabel={t("City", "المدينة")}
      series={[
        { key: "new", label: t("New", "جديدة") },
        { key: "waiting", label: t("Waiting for reply", "بانتظار الرد") },
      ]}
    />
  );
}

export function DonutChartExample() {
  const t = useT();
  return (
    <DonutChart
      className="w-full"
      title={t("Visits by source", "الزيارات حسب المصدر")}
      data={[
        { label: t("Search", "البحث"), value: 4200 },
        { label: t("Direct", "مباشر"), value: 2600 },
        { label: t("Social", "التواصل الاجتماعي"), value: 1500 },
        { label: t("Email", "البريد"), value: 700 },
      ]}
      value={formatNumber(9000, useLang())}
      label={t("Visits", "زيارة")}
    />
  );
}

export function SparklineExample() {
  const t = useT();
  return (
    <div className="grid w-full max-w-xs gap-3 rounded-card border border-line bg-surface p-5">
      <p className="text-sm text-fg-2">{t("Orders this week", "طلبات هذا الأسبوع")}</p>
      <p className="text-3xl font-semibold tabular-nums">{formatNumber(1284, useLang())}</p>
      <Sparkline values={[140, 162, 151, 180, 176, 210, 265]} title={t("Orders per day, last 7 days", "الطلبات اليومية في آخر 7 أيام")} className="text-fg" />
    </div>
  );
}

export function ChartLegendExample() {
  const t = useT();
  const lang = useLang();
  const pct = (n: number) => formatNumber(n, lang, { style: "percent" });
  return (
    <div className="grid gap-4">
      <ChartLegend items={[{ label: t("Website", "الموقع") }, { label: t("App", "التطبيق") }, { label: t("Store", "المتجر") }, { label: t("Partners", "الشركاء") }]} />
      <ChartLegend
        kind="fill"
        items={[
          { label: t("New", "جديدة"), value: pct(0.62) },
          { label: t("Waiting for reply", "بانتظار الرد"), value: pct(0.38) },
        ]}
      />
    </div>
  );
}
