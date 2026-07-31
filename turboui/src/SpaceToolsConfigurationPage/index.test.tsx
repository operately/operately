import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { SpaceToolsConfigurationPage } from "./index";

// This codebase tags elements with `data-test-id` (not the default
// `data-testid`), so resolve them via the attribute selector.
function queryByTestId(testId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
}

function renderPage(overrides: Partial<SpaceToolsConfigurationPage.Props> = {}) {
  const props: SpaceToolsConfigurationPage.Props = {
    title: ["Configure tools", "Growth"],
    tools: {
      discussionsEnabled: true,
      resourceHubEnabled: true,
      tasksEnabled: false,
      kpisEnabled: false,
    },
    onToolsChange: () => {},
    onSave: async () => {},
    onCancel: () => {},
    ...overrides,
  };

  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SpaceToolsConfigurationPage {...props} />
    </MemoryRouter>,
  );
}

describe("SpaceToolsConfigurationPage KPIs gating", () => {
  test("hides the KPIs tool row by default", () => {
    renderPage();
    expect(queryByTestId("kpis")).not.toBeInTheDocument();
  });

  test("shows the KPIs tool row when showKpis is enabled", () => {
    renderPage({ showKpis: true });
    expect(queryByTestId("kpis")).toBeInTheDocument();
  });
});
