import * as React from "react";
import { fireEvent, render } from "@testing-library/react";
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
      templatesEnabled: true,
    },
    onToolsChange: () => {},
    onSave: async () => {},
    onCancel: () => {},
    ...overrides,
  };

  return render(
    <MemoryRouter>
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

describe("SpaceToolsConfigurationPage Templates gating", () => {
  test("hides the Templates tool row by default", () => {
    renderPage();
    expect(queryByTestId("templates")).not.toBeInTheDocument();
  });

  test("shows the Templates tool row when showTemplates is enabled", () => {
    renderPage({ showTemplates: true });
    expect(queryByTestId("templates")).toBeInTheDocument();
  });

  test("reflects and updates the Templates setting", () => {
    const onToolsChange = jest.fn();
    renderPage({ showTemplates: true, onToolsChange });

    const toggle = queryByTestId("templates");
    expect(toggle).toHaveAttribute("data-state", "checked");

    fireEvent.click(toggle!);

    expect(onToolsChange).toHaveBeenCalledWith({
      discussionsEnabled: true,
      resourceHubEnabled: true,
      tasksEnabled: false,
      kpisEnabled: false,
      templatesEnabled: false,
    });
  });
});
