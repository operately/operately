import { shouldRevalidate } from "./navigation";
import type { ShouldRevalidateFunctionArgs } from "react-router";

function navigation(from: string, to: string, overrides: Partial<ShouldRevalidateFunctionArgs> = {}) {
  return {
    currentUrl: new URL(from, "https://operately.test"),
    nextUrl: new URL(to, "https://operately.test"),
    currentParams: { id: "project-1" },
    nextParams: { id: "project-1" },
    defaultShouldRevalidate: true,
    ...overrides,
  };
}

it.each(["check-ins", "discussions", "tasks", "docs-and-files"])(
  "switching to %s does not block on the loader",
  (tab) => {
    expect(shouldRevalidate(navigation("/projects/project-1?tab=overview", `/projects/project-1?tab=${tab}`))).toBe(
      false,
    );
  },
);

it("allows switching back to the implicit overview tab", () => {
  expect(shouldRevalidate(navigation("/projects/project-1?tab=discussions", "/projects/project-1"))).toBe(false);
});

it.each([
  ["/projects/project-1", "/projects/project-2?tab=discussions"],
  ["/projects/project-1?tab=tasks&filter=open", "/projects/project-1?tab=discussions&filter=all"],
  ["/projects/project-1?tab=discussions", "/projects/project-1?tab=discussions"],
])("preserves loader revalidation from %s to %s", (from, to) => {
  expect(shouldRevalidate(navigation(from, to))).toBe(true);
});

it("preserves submission revalidation even when the tab changes", () => {
  expect(
    shouldRevalidate(navigation("/projects/project-1", "/projects/project-1?tab=check-ins", { formMethod: "POST" })),
  ).toBe(true);
});

it("preserves the router default for unrelated navigation", () => {
  expect(
    shouldRevalidate(navigation("/projects/project-1", "/projects/project-2", { defaultShouldRevalidate: false })),
  ).toBe(false);
});
