import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { CodeBlock } from "../src/components/code-block";
import { JsonViewer } from "../src/components/json-viewer";
import { click, mount, useDom } from "./dom";

useDom();

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

const CODE = 'const a = 1;\nconst b = 2;\nexport { a, b };\n';

describe("CodeBlock", () => {
  test("left to right in every language, mono, with a copy button in the page language", () => {
    const out = ar(<CodeBlock code={CODE} filename="index.ts" />);
    expect(out).toMatch(/^<figure dir="ltr"/);
    expect(out).toContain("font-mono");
    expect(out).toContain('aria-label="نسخ"');
    expect(out).toContain(">index.ts<");
  });
  test("line numbers are hidden from screen readers and not selectable; no extra line for the final newline", () => {
    const out = html(<CodeBlock code={CODE} />);
    const numbers = [...out.matchAll(/<span aria-hidden="true" class="([^"]*)"[^>]*>(\d+)<\/span>/g)];
    expect(numbers.map((m) => m[2])).toEqual(["1", "2", "3"]);
    expect(numbers.every((m) => m[1]!.includes("select-none"))).toBe(true);
    expect(html(<CodeBlock code={CODE} lineNumbers={false} />)).not.toMatch(/aria-hidden="true" class="[^"]*select-none/);
  });
  test("each line ends with its newline, so blank lines survive a selected copy", () => {
    const code = html(<CodeBlock code={"a\n\nb"} lineNumbers={false} />).match(/<code[^>]*>(.*)<\/code>/s)![1]!;
    expect(code.replace(/<[^>]+>/g, "")).toBe("a\n\nb");
  });
  test("highlighted lines get the surface background and a start border", () => {
    const out = html(<CodeBlock code={CODE} highlight={[2]} lineNumbers={false} />);
    const lines = [...out.matchAll(/<span data-line="(\d)"( data-highlighted="true")? class="([^"]*)"/g)];
    expect(lines).toHaveLength(3);
    const [one, two] = [lines[0]!, lines[1]!];
    expect(two[2]).toBeDefined();
    expect(two[3]).toContain("bg-surface-2");
    expect(two[3]).toContain("border-fg-3");
    expect(one[2]).toBeUndefined();
    expect(one[3]).not.toContain("bg-surface-2");
  });
  test("the scroll area is focusable and named by the file name, else the language", () => {
    expect(html(<CodeBlock code={CODE} filename="index.ts" language="ts" />)).toMatch(/role="region" tabindex="0" aria-label="index.ts"/);
    expect(html(<CodeBlock code={CODE} language="TypeScript" />)).toMatch(/role="region" tabindex="0" aria-label="TypeScript"/);
    expect(html(<CodeBlock code={CODE} />)).toMatch(/tabindex="0"/);
  });
  test("children replace the plain code; copy still copies `code`", async () => {
    const out = html(
      <CodeBlock code="plain text">
        <span className="token">highlighted</span>
      </CodeBlock>,
    );
    expect(out).toContain('<span class="token">highlighted</span>');
    expect(out).not.toContain("plain text");

    const writeText = mock(async (_: string) => {});
    const real = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    try {
      const el = await mount(
        <CodeBlock code={CODE}>
          <span>highlighted</span>
        </CodeBlock>,
      );
      await click(el.querySelector('button[aria-label="Copy"]')!);
      expect(writeText).toHaveBeenCalledWith(CODE);
    } finally {
      if (real) Object.defineProperty(navigator, "clipboard", real);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });
});

const DATA = {
  name: "Sara",
  age: 31,
  admin: true,
  manager: false,
  team: null,
  address: { city: "Riyadh", postalCode: "12271" },
  tags: ["design", "web"],
  empty: {},
};

describe("JsonViewer", () => {
  test("renders every value type, left to right", () => {
    const out = html(<JsonViewer value={DATA} defaultDepth={2} />);
    expect(out).toMatch(/^<div dir="ltr"/);
    expect(out).toContain("&quot;Sara&quot;");
    expect(out).toContain(">31<");
    expect(out).toContain(">true<");
    expect(out).toContain(">false<");
    expect(out).toContain(">null<");
    expect(out).toContain("&quot;Riyadh&quot;");
    expect(out).toContain("&quot;design&quot;");
    expect(out).toContain("{}");
    expect(html(<JsonViewer value="a long string" />)).toContain("wrap-anywhere");
    expect(html(<JsonViewer value={42} />)).toContain(">42<");
  });
  test("nodes deeper than defaultDepth start collapsed and show their item count", () => {
    const out = html(<JsonViewer value={DATA} />);
    expect(out).toContain("&quot;Sara&quot;");
    expect(out).not.toContain("Riyadh");
    expect(out).toMatch(/aria-expanded="false" aria-label="Expand address"/);
    expect(out).toContain("2 items");
    expect(html(<JsonViewer value={DATA} defaultDepth={0} />)).toMatch(/aria-expanded="false" aria-label="Expand"/);
  });
  test("the item count and button labels in Arabic", () => {
    const out = ar(<JsonViewer value={DATA} />);
    expect(out).toContain("العناصر: 2");
    expect(out).toContain('aria-label="توسيع address"');
    expect(out).toContain('aria-label="طي"');
  });
  test("toggle buttons expand and collapse", async () => {
    const el = await mount(<JsonViewer value={DATA} />);
    const button = el.querySelector('button[aria-label="Expand address"]')!;
    await click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Collapse address");
    expect(el.textContent).toContain('"Riyadh"');
    await click(button);
    expect(el.textContent).not.toContain("Riyadh");
  });
  test("circular references show [Circular] and do not crash", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    a.list = [a];
    const out = html(<JsonViewer value={a} defaultDepth={10} />);
    expect(out.match(/\[Circular\]/g)).toHaveLength(2);
  });
});
