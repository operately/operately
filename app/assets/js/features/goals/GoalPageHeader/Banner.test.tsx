/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
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

  function renderBanner(goal: Goal) {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(banner(goal));
    return container;
  }

  it("renders nothing for an active goal without status dates", () => {
    expect(renderToStaticMarkup(banner(goal({})))).toBe("");
  });

  it.each([
    { isClosed: true, closedAt: "2024-05-12T12:00:00Z", state: "closed" },
    { isArchived: true, archivedAt: "2024-05-12T12:00:00Z", state: "archived" },
  ])("renders the $state banner", ({ state, ...overrides }) => {
    const container = renderBanner(goal(overrides));
    expect(container.querySelector(`[data-test-id="goal-${state}-banner"]`)).not.toBeNull();
  });

  it.each([null, undefined])("renders nothing when the closing date is missing (%s)", (closedAt) => {
    expect(renderToStaticMarkup(banner(goal({ isClosed: true, closedAt })))).toBe("");
  });

  it.each([null, undefined])("renders nothing when the archive date is missing (%s)", (archivedAt) => {
    expect(renderToStaticMarkup(banner(goal({ isArchived: true, archivedAt })))).toBe("");
  });

  it.each([null, undefined])("falls back to the archived banner when the closing date is missing (%s)", (closedAt) => {
    const container = renderBanner(
      goal({ isClosed: true, closedAt, isArchived: true, archivedAt: "2024-05-12T12:00:00Z" }),
    );

    expect(container.querySelector('[data-test-id="goal-archived-banner"]')).not.toBeNull();
    expect(container.querySelector('[data-test-id="goal-closed-banner"]')).toBeNull();
  });

  it("prefers the closed banner when both dates are present", () => {
    const container = renderBanner(
      goal({
        isClosed: true,
        closedAt: "2024-05-12T12:00:00Z",
        isArchived: true,
        archivedAt: "2024-05-13T12:00:00Z",
      }),
    );

    expect(container.querySelector('[data-test-id="goal-closed-banner"]')).not.toBeNull();
    expect(container.querySelector('[data-test-id="goal-archived-banner"]')).toBeNull();
  });
});
