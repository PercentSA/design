import { describe, expect, test } from "bun:test";
import { Card, DataTable, List, ListItem, PercentProvider, TimeText } from "../src";
import { ABOVE_STRETCHED_LINK } from "../src/components/card";
import { mount, useDom } from "./dom";

useDom();

describe("a time in a linked row or card", () => {
  test("the time of a linked row is above the row link", async () => {
    expect(ABOVE_STRETCHED_LINK).toContain("time[tabindex]");
    const el = await mount(
      <PercentProvider lang="en">
        <Card title="Card" href="/c">
          <TimeText value={new Date("2026-01-01T10:00:00Z")} />
        </Card>
        <DataTable columns={[{ key: "name", header: "Name" }]} rows={[{ id: "1", name: "A" }]} getRowId={(r) => r.id} caption="t" rowHref={() => "/r"} />
        <List>
          <ListItem title="Item" href="/i" />
        </List>
      </PercentProvider>,
    );
    const lifted = [...el.querySelectorAll("*")].filter((e) => e.getAttribute("class")?.includes("time[tabindex]"));
    expect(lifted.length).toBe(3);
  });
});
