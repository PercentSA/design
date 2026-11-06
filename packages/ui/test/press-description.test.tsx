import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, List, ListItem } from "../src";

const doc = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
};
const described = (el: Element) =>
  (el.querySelector("button")!.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => el.querySelector(`[id="${id}"]`)!.textContent);

describe("press parts name their facts", () => {
  test("Card onSelect: the button is described by the description and the body", () => {
    const el = doc(
      renderToStaticMarkup(
        <Card title="Brake pads" description="SKU-1" onSelect={() => {}}>
          <span>565 incl. VAT</span>
          <span>In stock 37</span>
        </Card>,
      ),
    );
    expect(el.querySelector("button")!.textContent).toBe("Brake pads");
    expect(described(el)).toEqual(["SKU-1", "565 incl. VATIn stock 37"]);
    // The body wrapper does not change the layout.
    expect(el.querySelector("div.contents")).not.toBeNull();
  });

  test("Card onSelect without a body or description: no aria-describedby; a link card is unchanged", () => {
    expect(renderToStaticMarkup(<Card title="Only" onSelect={() => {}} />)).not.toContain("aria-describedby");
    const link = renderToStaticMarkup(
      <Card title="Doc" href="/d" description="x">
        <span>body</span>
      </Card>,
    );
    expect(link).not.toContain("aria-describedby");
    expect(link).not.toContain('class="contents"');
  });

  test("ListItem onSelect: described by the description and the trailing part", () => {
    const el = doc(
      renderToStaticMarkup(
        <List>
          <ListItem title="Anas" description="Riyadh" trailing="+966 55 000 0000" onSelect={() => {}} />
        </List>,
      ),
    );
    expect(el.querySelector("button")!.textContent).toBe("Anas");
    expect(described(el)).toEqual(["Riyadh", "+966 55 000 0000"]);
    expect(
      renderToStaticMarkup(
        <List>
          <ListItem title="Plain" description="x" />
        </List>,
      ),
    ).not.toContain("aria-describedby");
  });
});
