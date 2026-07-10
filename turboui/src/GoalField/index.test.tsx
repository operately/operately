import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { GoalField } from ".";

jest.mock("../icons", () => {
  const React = require("react");
  const Icon = ({ size }: { size?: number }) => React.createElement("span", { "data-icon-size": size });

  return {
    IconCircleX: Icon,
    IconExternalLink: Icon,
    IconGoal: Icon,
    IconSearch: Icon,
  };
});

describe("GoalField", () => {
  function renderGoalField(ui: React.ReactElement) {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>,
    );
  }

  it("keeps the action menu compact", () => {
    const searchGoals = jest.fn().mockResolvedValue([]);

    const { container } = renderGoalField(
      <GoalField
        goal={{ id: "goal-1", name: "Expand team capabilities", link: "#" }}
        setGoal={jest.fn()}
        searchGoals={searchGoals}
        testId="parent-goal-field"
      />,
    );

    fireEvent.click(screen.getByText("Expand team capabilities"));

    const dialog = container.ownerDocument.querySelector('[data-test-id="parent-goal-field-dialog"]');
    expect(dialog).toHaveStyle({ width: "220px" });
  });

  it("uses a wider dialog and wraps long search result names", async () => {
    const longGoalName = "Increase retention across enterprise accounts with a coordinated onboarding program";
    const searchGoals = jest.fn().mockResolvedValue([{ id: "goal-1", name: longGoalName, link: "#" }]);

    const { container } = renderGoalField(
      <GoalField
        goal={null}
        setGoal={jest.fn()}
        searchGoals={searchGoals}
        emptyStateMessage="Set parent goal"
        testId="parent-goal-field"
      />,
    );

    fireEvent.click(screen.getByText("Set parent goal"));

    await waitFor(() => expect(searchGoals).toHaveBeenCalled());

    const dialog = container.ownerDocument.querySelector('[data-test-id="parent-goal-field-dialog"]');
    expect(dialog).toHaveStyle({ width: "min(420px, calc(100vw - 32px))" });

    const results = container.ownerDocument.querySelector('[data-test-id="parent-goal-field-search-results"]');
    expect(results).toHaveStyle({ maxHeight: "210px" });

    const result = await screen.findByText(longGoalName);
    expect(result).toHaveClass("whitespace-normal", "break-words");
    expect(result).not.toHaveClass("truncate");
    expect(result).toHaveAttribute("title", longGoalName);
  });
});
