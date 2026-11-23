import { useEffect, useState } from "react";
import { useT } from "~/lib/t";
import { CodeBlock, JsonViewer, LogViewer, type LogLive, type LogRow } from "@percentsa/ui";
import { CodeDiff, CodeEditor, type CodeDiagnostic } from "@percentsa/ui/code-editor";

const ROOT = `import { PercentProvider } from "@percentsa/ui";

export function App({ lang, children }: { lang: "en" | "ar"; children: React.ReactNode }) {
  return <PercentProvider lang={lang}>{children}</PercentProvider>;
}
`;

export function CodeBlockExample() {
  return <CodeBlock code={ROOT} filename="app/root.tsx" highlight={[4]} className="w-full max-w-xl" />;
}

// Highlighted children (for example Shiki tokens rendered on the server). Copy still copies `code`, without the "$ ".
export function CodeBlockHighlightedExample() {
  return (
    <CodeBlock code="bun add @percentsa/ui" language="bash" className="w-full max-w-xl">
      <span className="text-fg-3">$ </span>
      <span className="font-semibold text-fg">bun</span> <span className="text-fg-2">add @percentsa/ui</span>
    </CodeBlock>
  );
}

export function JsonViewerExample() {
  const t = useT();
  const invoice = {
    number: "INV-2026-0142",
    customer: { name: t("Sara Al-Qahtani", "سارة القحطاني"), city: t("Riyadh", "الرياض"), vatNumber: "300000000000003" },
    total: 1150,
    paid: true,
    refund: null,
    lines: [
      { description: t("Website design", "تصميم موقع"), quantity: 1, unitPrice: 800 },
      { description: t("Hosting, one year", "استضافة لمدة سنة"), quantity: 1, unitPrice: 200 },
    ],
  };
  return <JsonViewer value={invoice} className="w-full max-w-xl rounded-card border border-line bg-surface p-4" />;
}

const CONFIG = `services:
  web:
    image: example/web:1.4
    ports:
      - "8080:80"
    depends_on:
      - db
  db:
    image: example/db:16
    volumes:
      - data:/var/lib/db
`;

// A sample the app checks itself: the editor only marks the lines it is given.
const checkConfig = (text: string, message: string): CodeDiagnostic[] =>
  text.split("\n").flatMap((line, i) => (/:latest\s*$/.test(line) ? [{ line: i + 1, message }] : []));

export function CodeEditorExample() {
  const t = useT();
  const [value, setValue] = useState(CONFIG);
  return (
    <div className="w-full max-w-xl">
      <CodeEditor value={value} onValueChange={setValue} diagnostics={checkConfig(value, t("Name a version, not latest", "حدّد إصدارًا بدل latest"))} label={t("Service settings", "إعدادات الخدمات")} minLines={10} />
      <p className="mt-2 text-sm text-fg-3">{t("Change an image version to “latest” to see an error on its line.", "غيّر إصدار صورة إلى «latest» لترى الخطأ على سطرها.")}</p>
    </div>
  );
}

export function CodeEditorOwnListExample() {
  const t = useT();
  const [value, setValue] = useState(CONFIG);
  const found = checkConfig(value, t("Name a version, not latest", "حدّد إصدارًا بدل latest"));
  return (
    <div className="w-full max-w-xl">
      <ul aria-live="polite" className="mb-2 list-none text-sm text-danger">
        {found.map((d, i) => (
          <li key={i}>{t(`Line ${d.line}: ${d.message}`, `السطر ${d.line}: ${d.message}`)}</li>
        ))}
      </ul>
      <CodeEditor value={value} onValueChange={setValue} diagnostics={found} errorList={false} label={t("Service settings", "إعدادات الخدمات")} minLines={8} />
    </div>
  );
}

export function CodeEditorReadOnlyExample() {
  const t = useT();
  return <CodeEditor value={CONFIG} readOnly label={t("Service settings, read only", "إعدادات الخدمات، للقراءة فقط")} minLines={4} className="w-full max-w-xl" />;
}

export function CodeDiffExample() {
  const t = useT();
  return <CodeDiff before={CONFIG} after={CONFIG.replace("web:1.4", "web:1.5").replace("8080:80", "8081:80")} label={t("Settings before and after", "الإعدادات قبل التعديل وبعده")} className="w-full max-w-3xl" />;
}

const clock = (i: number) => `10:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`;
const BUILD_ROWS: LogRow[] =
  Array.from({ length: 40 }, (_, i) => ({
    key: `b${i}`,
    at: clock(i),
    source: i % 2 ? "bundler" : "compiler",
    text: i === 12 || i === 31 ? `error: cannot find module "./missing-${i}"` : `step ${i + 1} of 40 done`,
    error: i === 12 || i === 31,
  }));

export function LogViewerExample() {
  const t = useT();
  const [search, setSearch] = useState("");
  return (
    <LogViewer
      label={t("Build log", "سجل البناء")}
      rows={BUILD_ROWS}
      live="off"
      onLiveChange={() => {}}
      search={search}
      onSearchChange={setSearch}
      empty={t("No lines yet.", "لا توجد أسطر بعد.")}
      status={t("Build finished", "اكتمل البناء")}
      height="20rem"
      className="w-full max-w-2xl"
    />
  );
}

export function LogViewerLiveExample() {
  const t = useT();
  const [live, setLive] = useState<LogLive>("on");
  const [rows, setRows] = useState<LogRow[]>(() => BUILD_ROWS.slice(0, 12));
  useEffect(() => {
    if (live !== "on") return;
    const id = setInterval(
      () => setRows((r) => {
          const n = (r.at(-1) ? Number(r.at(-1)!.key.slice(1)) : 0) + 1; // keys keep counting after old rows drop
          return [...r, { key: `l${n}`, at: clock(n), source: "server", text: `request ${n} handled` }].slice(-200);
        }),
      2000,
    );
    return () => clearInterval(id);
  }, [live]);
  return (
    <LogViewer
      label={t("Server log", "سجل الخادم")}
      rows={rows}
      live={live}
      onLiveChange={setLive}
      empty={t("No lines yet.", "لا توجد أسطر بعد.")}
      status={live === "on" ? t("Live", "بث مباشر") : t("Paused", "متوقف مؤقتًا")}
      height="16rem"
      className="w-full max-w-2xl"
    />
  );
}
