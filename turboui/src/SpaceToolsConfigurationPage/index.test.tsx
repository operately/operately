import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { i18nOptions } from "../i18nOptions";

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

describe("SpaceToolsConfigurationPage KPIs", () => {
  test("shows the KPIs tool row", () => {
    renderPage();
    expect(queryByTestId("kpis")).toBeInTheDocument();
  });

  test("reflects and updates the KPIs setting", () => {
    const onToolsChange = jest.fn();
    renderPage({ onToolsChange });

    const toggle = queryByTestId("kpis");
    expect(toggle).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(toggle!);

    expect(onToolsChange).toHaveBeenCalledWith({
      discussionsEnabled: true,
      resourceHubEnabled: true,
      tasksEnabled: false,
      kpisEnabled: true,
      templatesEnabled: true,
    });
  });
});

describe("SpaceToolsConfigurationPage Templates", () => {
  test("shows the Templates tool row", () => {
    renderPage();
    expect(queryByTestId("templates")).toBeInTheDocument();
  });

  test("reflects and updates the Templates setting", () => {
    const onToolsChange = jest.fn();
    renderPage({ onToolsChange });

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

it.each([
  ["en", "Templates", "Save"],
  ["en", "Translated templates", "Translated save"],
  ["pt-BR", "Templates", "Save"],
])("uses catalog copy and accessible tool names with English fallback: %s / %s", async (language, templates, save) => {
  const i18n = createInstance();
  await i18n.init({
    ...i18nOptions,
    lng: language,
    resources: { en: { translation: { Templates: templates, Save: save } }, "pt-BR": { translation: {} } },
  });
  const onToolsChange = jest.fn();
  const onSave = jest.fn(async () => {});

  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SpaceToolsConfigurationPage
          title="Growth"
          tools={{
            discussionsEnabled: true,
            resourceHubEnabled: true,
            tasksEnabled: false,
            kpisEnabled: false,
            templatesEnabled: true,
          }}
          onToolsChange={onToolsChange}
          onSave={onSave}
          onCancel={() => {}}
        />
      </MemoryRouter>
    </I18nextProvider>,
  );

  const toggle = screen.getByRole("switch", { name: templates });
  expect(toggle).toBeChecked();
  fireEvent.click(toggle);
  expect(onToolsChange).toHaveBeenCalledWith(expect.objectContaining({ templatesEnabled: false }));
  fireEvent.click(screen.getByRole("button", { name: save }));
  expect(onSave).toHaveBeenCalledTimes(1);
});
