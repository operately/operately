import type { ShouldRevalidateFunctionArgs } from "react-router";
import { shouldRevalidate } from "./navigation";

function navigation(from: string, to: string, overrides: Partial<ShouldRevalidateFunctionArgs> = {}) {
  return {
    currentUrl: new URL(from, "https://operately.test/admin/curated-templates"),
    nextUrl: new URL(to, "https://operately.test/admin/curated-templates"),
    currentParams: {},
    nextParams: {},
    defaultShouldRevalidate: true,
    ...overrides,
  };
}

it.each([
  ["", "?tab=goal"],
  ["?tab=goal", "?tab=kpi"],
  ["?tab=kpi", ""],
  ["?filter=draft&tab=kpi", "?tab=project&filter=draft"],
])("filters the loaded catalog without reloading from %s to %s", (from, to) => {
  expect(shouldRevalidate(navigation(from, to))).toBe(false);
});

it.each([
  ["?tab=project", "?tab=project"],
  ["?tab=goal&filter=draft", "?tab=kpi&filter=published"],
  ["/admin/curated-templates/template-kpi", "/admin/curated-templates?tab=kpi"],
])("preserves revalidation from %s to %s", (from, to) => {
  expect(shouldRevalidate(navigation(from, to))).toBe(true);
});

it("preserves mutation revalidation", () => {
  expect(shouldRevalidate(navigation("?tab=project", "?tab=goal", { formMethod: "POST" }))).toBe(true);
});
