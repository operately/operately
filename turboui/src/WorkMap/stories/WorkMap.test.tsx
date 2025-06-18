import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "@jest/globals";
import { Page } from "../../Page";
import WorkMap from "../components";
import { closedParentWithOngoingChildren, mockItems, mockSingleItem } from "../tests/mockData";

// Utility function to render WorkMap in a consistent way for tests
const renderWorkMap = (props) => {
  return render(
    <div className="py-4">
      <Page title={props.title} size="fullwidth">
        <WorkMap {...props} />
      </Page>
    </div>,
  );
};

// Helper functions similar to the steps in the Storybook tests
const selectTab = async (tab: string) => {
  // Map the tab ID to its display label
  const tabLabels = {
    all: "All work",
    goals: "Goals",
    projects: "Projects",
    completed: "Completed",
    paused: "Paused",
  };

  const tabLabel = tabLabels[tab] || tab;

  // Find and click the tab
  const tabElement = screen.getByRole("link", { name: new RegExp(tabLabel, "i") });
  await userEvent.click(tabElement);
};

const assertRowsNumber = (count: number) => {
  const rowgroups = screen.getAllByRole("rowgroup");
  expect(rowgroups.length).toBeGreaterThan(1); // Ensure we have at least 2 rowgroups

  const tableBody = rowgroups[1]!; // Second rowgroup is tbody
  const tableRows = within(tableBody).queryAllByRole("row");

  expect(tableRows.length).toEqual(count);
};

const assertItemName = (name: string) => {
  const itemName = screen.getByText(name);
  expect(itemName).toBeInTheDocument();
};

const refuteItemName = (name: string) => {
  const itemName = screen.queryByText(name);
  expect(itemName).not.toBeInTheDocument();
};

const assertZeroState = () => {
  const emptyStateText = screen.getByText("🍃 Nothing here");
  expect(emptyStateText).toBeInTheDocument();
};

describe("WorkMap Component", () => {
  test("Default view displays correct number of rows", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: mockItems,
    });

    assertRowsNumber(14);
  });

  test("Single item view displays one row with correct name", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: [mockSingleItem],
    });

    assertRowsNumber(1);
    assertItemName("Single standalone goal with no children");
  });

  test("Empty view displays zero state message", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: [],
    });

    assertRowsNumber(1);
    assertZeroState();
  });

  test("Goals tab filters items correctly", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: mockItems,
    });

    assertRowsNumber(14);

    await selectTab("goals");

    assertRowsNumber(9);
    assertItemName("Acquire the first users of Operately outside Semaphore");
    assertItemName("Launch in European market");
  });

  test("Projects tab filters items correctly", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: mockItems,
    });

    assertRowsNumber(14);

    await selectTab("projects");

    assertRowsNumber(5);
    assertItemName("Redesign welcome screen");
    assertItemName("Research phase: ML model selection");

    // Paused projects are not shown
    refuteItemName("Release 0.4");
    refuteItemName("Create onboarding email sequence");

    // Completed projects are not shown
    refuteItemName("Legacy data migration");
  });

  test("Completed tab filters items correctly", async () => {
    renderWorkMap({
      title: "Company Work Map",
      items: mockItems,
    });

    assertRowsNumber(14);

    await selectTab("completed");

    assertRowsNumber(3);
    assertItemName("Document features in Help Center");
    assertItemName("Legacy database migration");
    assertItemName("Legacy system migration to cloud infrastructure");
  });

  test("Closed parent with ongoing children displayed correctly", async () => {
    renderWorkMap({
      title: "Closed Parent with Ongoing Children",
      items: closedParentWithOngoingChildren,
    });

    await selectTab("goals");
    assertRowsNumber(3); // Parent + 2 goal children
    assertItemName("Enhance product platform architecture");

    await selectTab("projects");
    assertRowsNumber(2);
    assertItemName("Set up CI/CD pipeline");
    assertItemName("Implement Consul integration");

    await selectTab("completed");
    assertRowsNumber(2);
    assertItemName("Enhance product platform architecture");
    assertItemName("Implement service discovery");

    await selectTab("all");
    assertRowsNumber(6); // Parent + 5 children
    assertItemName("Enhance product platform architecture");
    assertItemName("Implement service discovery");
  });
});
