import { renderToStaticMarkup } from "react-dom/server";
import type { Goal } from "@/models/goals";
import { banner } from "./Banner";

jest.mock("../../../../../../turboui/node_modules/react", () => jest.requireActual("react"));

jest.mock("@/hooks/useFormattedTimePreferences", () => ({
  useFormattedTimePreferences: () => ({ locale: "en-US", timezone: "Etc/UTC", timeFormat: "12h" }),
}));

describe("goal status banner", () => {
  const goal = (overrides: Partial<Goal>): Goal => ({
    __typename: "goal",
    id: "goal-1",
    name: "Launch",
    status: "on_track",
    isClosed: false,
    isArchived: false,
    closedAt: null,
    archivedAt: null,
    ...overrides,
  });

  it("renders nothing for an active goal without status dates", () => {
    expect(renderToStaticMarkup(banner(goal({})))).toBe("");
  });

  it.each([
    { isClosed: true, closedAt: "2024-05-12T12:00:00Z", label: "closed" },
    { isArchived: true, archivedAt: "2024-05-12T12:00:00Z", label: "archived" },
  ])("renders the $label date", ({ label, ...overrides }) => {
    expect(renderToStaticMarkup(banner(goal(overrides)))).toContain(`This goal was ${label} on May 12th, 2024`);
  });

  it.each([null, undefined])("renders nothing when the closing date is missing (%s)", (closedAt) => {
    expect(renderToStaticMarkup(banner(goal({ isClosed: true, closedAt })))).toBe("");
  });

  it.each([null, undefined])("renders nothing when the archive date is missing (%s)", (archivedAt) => {
    expect(renderToStaticMarkup(banner(goal({ isArchived: true, archivedAt })))).toBe("");
  });

  it.each([null, undefined])("falls back to the archived banner when the closing date is missing (%s)", (closedAt) => {
    const markup = renderToStaticMarkup(
      banner(goal({ isClosed: true, closedAt, isArchived: true, archivedAt: "2024-05-12T12:00:00Z" })),
    );

    expect(markup).toContain("This goal was archived on May 12th, 2024");
    expect(markup).not.toContain("This goal was closed");
  });

  it("prefers the closed banner when both dates are present", () => {
    const markup = renderToStaticMarkup(
      banner(
        goal({
          isClosed: true,
          closedAt: "2024-05-12T12:00:00Z",
          isArchived: true,
          archivedAt: "2024-05-13T12:00:00Z",
        }),
      ),
    );

    expect(markup).toContain("This goal was closed on May 12th, 2024");
    expect(markup).not.toContain("This goal was archived");
  });
});
