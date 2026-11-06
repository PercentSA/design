import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageField, PercentProvider } from "../src";

const html = (props: Partial<Parameters<typeof ImageField>[0]>) =>
  renderToStaticMarkup(
    <PercentProvider lang="en">
      <ImageField value="https://cdn.example/logo.png" onValueChange={() => {}} upload={async () => ""} alt="Logo" {...props} />
    </PercentProvider>,
  );
const img = (markup: string) => markup.match(/<img[^>]*>/)![0];

describe("0.16.1 ImageField preview", () => {
  test("the default preview fills its box and follows the page theme (unchanged)", () => {
    const tag = img(html({}));
    expect(tag).toContain("object-cover");
    expect(tag).not.toContain("data-theme");
  });

  test("fit contain shows the whole image", () => {
    const tag = img(html({ fit: "contain" }));
    expect(tag).toContain("object-contain");
    expect(tag).not.toContain("object-cover");
  });

  test("previewTheme dark puts the preview on the dark theme's surface in both page themes", () => {
    expect(img(html({ previewTheme: "dark" }))).toContain('data-theme="dark"');
  });
});
