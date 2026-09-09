import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { WorkMap } from "./index";
import { mockSingleItem } from "../tests/mockData";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

function mapElement(props: Partial<WorkMap.Props> = {}) {
  return (
    <MemoryRouter>
      <WorkMap
        title="Company Work Map"
        items={[]}
        formattedTimePreferences={defaultFormattedTimePreferences}
        {...props}
      />
    </MemoryRouter>
  );
}

function renderMap(props: Partial<WorkMap.Props> = {}) {
  return render(mapElement(props));
}

describe("Work Map creation loading", () => {
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
