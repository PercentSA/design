import { useT } from "~/lib/t";
import { CodeBlock, JsonViewer } from "@percentsa/ui";

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
