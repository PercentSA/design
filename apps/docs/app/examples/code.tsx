import { useState } from "react";
import { useT } from "~/lib/t";
import { CodeBlock, JsonViewer } from "@percentsa/ui";
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
const checkConfig = (text: string): CodeDiagnostic[] =>
  text.split("\n").flatMap((line, i) => (/:latest\s*$/.test(line) ? [{ line: i + 1, message: "Name a version, not latest" }] : []));

export function CodeEditorExample() {
  const t = useT();
  const [value, setValue] = useState(CONFIG);
  return (
    <div className="w-full max-w-xl">
      <CodeEditor value={value} onValueChange={setValue} diagnostics={checkConfig(value)} label={t("Service settings", "إعدادات الخدمات")} minLines={10} />
      <p className="mt-2 text-sm text-fg-3">{t("Change an image version to “latest” to see an error on its line.", "غيّر إصدار صورة إلى «latest» لترى الخطأ على سطرها.")}</p>
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
