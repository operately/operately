/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderToStaticMarkup } from "react-dom/server";
import type { Goal } from "@/models/goals";
import { banner } from "./Banner";

jest.mock("../../../../../../turboui/node_modules/react", () => jest.requireActual("react"));

jest.mock("@/hooks/useFormattedTimePreferences", () => ({
  useFormattedTimePreferences: () => ({ locale: "en-US", timezone: "Etc/UTC", timeFormat: "12h" }),
}));

describe("goal status banner", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

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
    { isClosed: true, closedAt: "2024-05-12T12:00:00Z", state: "closed", expectedDate: "May 12th, 2024" },
    { isArchived: true, archivedAt: "2024-05-13T12:00:00Z", state: "archived", expectedDate: "May 13th, 2024" },
  ])("renders the $state banner with its date", ({ state, expectedDate, ...overrides }) => {
    const container = renderBanner(goal(overrides));
    const statusBanner = container.querySelector(`[data-test-id="goal-${state}-banner"]`);
    expect(statusBanner).not.toBeNull();
    expect(statusBanner?.textContent).toContain(expectedDate);
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

    const archivedBanner = container.querySelector('[data-test-id="goal-archived-banner"]');
    expect(archivedBanner).not.toBeNull();
    expect(archivedBanner?.textContent).toContain("May 12th, 2024");
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

    const closedBanner = container.querySelector('[data-test-id="goal-closed-banner"]');
    expect(closedBanner).not.toBeNull();
    expect(closedBanner?.textContent).toContain("May 12th, 2024");
    expect(container.querySelector('[data-test-id="goal-archived-banner"]')).toBeNull();
  });
});
