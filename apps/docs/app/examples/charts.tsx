import { AreaChart, BarChart, ChartLegend, DonutChart, formatNumber, LineChart, Sparkline, toast, useLang } from "@percentsa/ui";
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

export function LineChartLimitExample() {
  const t = useT();
  const cpu = [22, 18, 15, 20, 35, 52, 64, 71, 88, 96, 92, 85, 78, 82, 90, 97, 99, 86, 70, 55, 41, 33, 28, 24];
  return (
    <LineChart
      className="w-full"
      title={t("CPU use by hour", "استخدام المعالج حسب الساعة")}
      data={cpu.map((v, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, cpu: v }))}
      x="hour"
      xLabel={t("Hour", "الساعة")}
      series={[{ key: "cpu", label: t("CPU (%)", "المعالج (%)") }]}
      limit={{ value: 100, label: t("Limit 1 CPU", "الحد: معالج واحد") }}
      onSelectPoint={(hour) => toast({ title: t(`Opened ${hour}`, `تم فتح ${hour}`) })}
    />
  );
}

export function AreaChartLimitExample() {
  const t = useT();
  const memory = [0.21, 0.24, 0.3, 0.33, 0.38, 0.41, 0.47, 0.44, 0.36, 0.29];
  return (
    <AreaChart
      className="w-full"
      title={t("Memory use", "استخدام الذاكرة")}
      data={memory.map((v, i) => ({ minute: `10:${String(i * 5).padStart(2, "0")}`, memory: v }))}
      x="minute"
      xLabel={t("Time", "الوقت")}
      series={[{ key: "memory", label: t("Memory (GB)", "الذاكرة (GB)") }]}
      curve="monotone"
      limit={{ value: 0.5, label: t("Limit 0.5 GB", "الحد: 0.5 GB") }}
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
