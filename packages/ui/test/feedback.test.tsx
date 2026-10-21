import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Alert, Badge, EmptyState, PercentProvider, Progress, ProgressRing, Skeleton, StatusDot, Tag } from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);

describe("feedback", () => {
  test("Alert: errors and warnings interrupt (alert); info and success wait (status)", () => {
    expect(html(<Alert tone="danger" title="Failed">x</Alert>)).toContain('role="alert"');
    expect(html(<Alert tone="warning" title="Careful" />)).toContain('role="alert"');
    expect(html(<Alert tone="success" title="Saved" />)).toContain('role="status"');
    expect(html(<Alert title="Note" />)).toContain('role="status"');
  });
  test("Progress exposes its value and fills from the start side", () => {
    const out = html(<Progress value={40} aria-label="Upload" />);
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="40"');
    expect(out).toContain('aria-valuemax="100"');
    expect(out).toContain("width:40%");
  });
  test("ProgressRing is a progressbar with its percentage", () => {
    const out = html(<ProgressRing value={3} max={4} aria-label="Steps" showValue />);
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="3"');
    expect(out).toContain('aria-valuemax="4"');
    expect(out).toContain(">75%<");
  });
  test("StatusDot: the colour is never the only signal", () => {
    expect(html(<StatusDot status="live">Online</StatusDot>)).toContain(">Online<");
    expect(html(<StatusDot status="live" />)).toContain('aria-hidden="true"');
    expect(html(<StatusDot status="live" />)).toContain("bg-live");
  });
  test("Tag removal button is labelled with the tag", () => {
    const out = html(<PercentProvider lang="ar"><Tag onRemove={() => {}}>تصميم</Tag></PercentProvider>);
    expect(out).toContain('aria-label="إزالة تصميم"');
  });
  test("Badge, Skeleton and EmptyState render", () => {
    expect(html(<Badge>New</Badge>)).toContain(">New<");
    expect(html(<Skeleton className="h-4" />)).toContain('aria-hidden="true"');
    expect(html(<Skeleton className="h-4" />)).toContain("motion-reduce:animate-none");
    const empty = html(<EmptyState title="No projects yet" description="Add one" />);
    expect(empty).toContain("No projects yet");
    expect(empty).toContain("<svg");
  });
});
