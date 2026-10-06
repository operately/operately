import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { WorkMap } from "./index";
import { mockSingleItem } from "../tests/mockData";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

function mapElement(props: Partial<WorkMap.Props> = {}, initialEntry = "/") {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <WorkMap
        title="Company Work Map"
        items={[]}
        formattedTimePreferences={defaultFormattedTimePreferences}
        {...props}
      />
    </MemoryRouter>
  );
}

function renderMap(props: Partial<WorkMap.Props> = {}, initialEntry = "/") {
  return render(mapElement(props, initialEntry));
}

describe("Work Map creation loading", () => {
  it("looks up work-map tabs and undated timeline states", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        Projects: "Expanded translated projects tab",
        "Nothing in this view has dates yet.": "Translated undated work",
        "{{count}} items are hidden because they do not have dates.": "Translated {{count}} undated items",
      },
      true,
      true,
    );
    renderMap(
      {
        items: [
          { ...mockSingleItem, type: "project", timeframe: null, completedOn: null, status: "on_track", children: [] },
        ],
      },
      "/?tab=projects&view=timeline",
    );
    expect(screen.getByText("Expanded translated projects tab")).toBeInTheDocument();
    expect(screen.getByText("Translated undated work")).toBeInTheDocument();
    expect(screen.getByText("Translated 1 undated items")).toBeInTheDocument();
  });

  it("keeps work-map tab test ids stable when labels are translated", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "All work": "Todo o trabalho",
        Goals: "Objetivos",
        Projects: "Projetos",
        Paused: "Pausados",
        Completed: "Concluídos",
      },
      true,
      true,
    );
    renderMap();

    expect(document.querySelector('[data-test-id="tab-all"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-goals"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-projects"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-paused"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-completed"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-all work"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="tab-objetivos"]')).not.toBeInTheDocument();
  });

  it("keeps existing items visible without a loading indicator while creation data loads", () => {
    renderMap({ items: [mockSingleItem], creationLoading: true, addingEnabled: true });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(mockSingleItem.name)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add new item" })).not.toBeInTheDocument();
  });

  it("waits silently before showing the empty state or first-project form", () => {
    renderMap({ creationLoading: true, addingEnabled: true, emptyStateVariant: "first-project" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="first-project-zero-state"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Nothing here yet.")).not.toBeInTheDocument();
  });

  it.each([
    { state: "loading", creationLoading: true },
    { state: "failed", creationError: true },
  ])("preserves an empty filtered tab when creation data is $state", ({ state: _state, ...creationState }) => {
    renderMap(
      {
        items: [mockSingleItem],
        addingEnabled: true,
        zeroStateMessage: "empty-filter-state",
        ...creationState,
      },
      "/?tab=completed",
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("empty-filter-state", { exact: false })).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-project"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-goal"]')).not.toBeInTheDocument();
  });

  it.each([{ items: [] }, { items: [mockSingleItem] }])(
    "keeps failures out of the page layout for $items.length items",
    ({ items }) => {
      renderMap({ items, creationError: true });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
      if (items.length) expect(screen.getByRole("table")).toBeInTheDocument();
    },
  );

  it("keeps the existing read-only empty state when creation is unavailable by permission", () => {
    renderMap({ addingEnabled: false });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("opens onboarding after loading and preserves a draft when ready data refreshes", () => {
    const props: Partial<WorkMap.Props> = {
      addingEnabled: true,
      emptyStateVariant: "first-project",
      addItemDefaultSpace: { id: "general", name: "General", link: "/general" },
      addItem: jest.fn(),
      spaceSearch: jest.fn(),
      projectTemplates: [],
    };
    const { rerender } = renderMap({ ...props, creationLoading: true });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    rerender(mapElement({ ...props, creationLoading: false }));
    const name = screen.getByLabelText("Project name");
    fireEvent.change(name, { target: { value: "Draft project" } });
    rerender(mapElement({ ...props, projectTemplates: [], creationLoading: false }));
    expect(screen.getByLabelText("Project name")).toBe(name);
    expect(name).toHaveValue("Draft project");
  });
});

it("looks up the next-step column heading", () => {
  i18n.addResourceBundle("en", "translation", { "Next step": "Translated next step" }, true, true);
  renderMap({ items: [mockSingleItem] });
  expect(screen.getByText("Translated next step")).toBeInTheDocument();
});
