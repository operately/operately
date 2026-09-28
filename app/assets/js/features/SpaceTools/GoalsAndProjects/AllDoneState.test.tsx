/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Goal, Project } from "@/api";
import { i18n, applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { AllDoneState } from "./AllDoneState";

jest.mock("turboui", () => ({ IconTrophy: () => null }));
jest.mock("../components", () => ({ Title: () => null }));
setupTestCatalog();

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-08-15T12:00:00Z"));
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => jest.useRealTimers());

it.each([
  [0, 0, ""],
  [0, 1, "1 project"],
  [0, 3, "3 projects"],
  [1, 0, "1 goal"],
  [3, 0, "3 goals"],
  [1, 1, "1 goal and 1 project"],
  [1, 3, "1 goal and 3 projects"],
  [3, 1, "3 goals and 1 project"],
  [3, 3, "3 goals and 3 projects"],
])(
  "keeps English completion counts with missing Portuguese: %i goals, %i projects",
  async (goalsCount, projectsCount, expected) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await applyLanguage("pt-BR");
    const goals: Goal[] = Array.from({ length: goalsCount }, (_, id) => ({
      __typename: "goal",
      id: String(id),
      name: "Goal",
      status: "achieved",
      closedAt: "2026-08-01T12:00:00Z",
    }));
    const projects: Project[] = Array.from({ length: projectsCount }, (_, id) => ({
      __typename: "project",
      id: String(id),
      name: "Project",
      status: "achieved",
      successStatus: "achieved",
      goalId: "goal",
      spaceId: "space",
      state: "closed",
      closedAt: "2026-08-01T12:00:00Z",
    }));
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <AllDoneState
            title="Work"
            space={{ __typename: "space", id: "space", name: "Space" }}
            goals={goals}
            projects={projects}
          />,
        ),
      );
      expect(container.textContent).toBe(`All done!${expected ? `${expected} completed this quarter.` : ""}`);
    } finally {
      act(() => root.unmount());
    }
  },
);
