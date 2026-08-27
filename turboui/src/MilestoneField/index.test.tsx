import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MilestoneField } from "./index";

const milestones = [{ id: "m-1", name: "Launch" }];

function getByTestId(testId: string): HTMLElement {
  const element = document.querySelector(`[data-test-id="${testId}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing element with data-test-id="${testId}"`);

  return element;
}

function queryByTestId(testId: string): HTMLElement | null {
  return document.querySelector(`[data-test-id="${testId}"]`);
}

function openMilestoneField() {
  const trigger = getByTestId("milestone-field").closest("button");
  if (!(trigger instanceof HTMLButtonElement)) throw new Error("Missing milestone field trigger");

  fireEvent.click(trigger);
}

describe("MilestoneField", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("keeps the default trigger unbordered", () => {
    render(
      <MilestoneField
        milestone={null}
        setMilestone={jest.fn()}
        milestones={milestones}
        onSearch={async () => undefined}
        testId="milestone-field"
      />,
    );

    expect(document.querySelector('[data-test-id="milestone-field"]')?.closest("button")).not.toHaveClass(
      "border-surface-outline",
    );
  });

  it("uses a form-field trigger that fills the bordered box", () => {
    render(
      <MilestoneField
        variant="form-field"
        milestone={null}
        setMilestone={jest.fn()}
        milestones={milestones}
        onSearch={async () => undefined}
        emptyStateMessage="No milestone"
        testId="milestone-field"
      />,
    );

    const trigger = document.querySelector('[data-test-id="milestone-field"]')?.closest("button");
    expect(trigger).toHaveClass("border-surface-outline");
    expect(trigger).toHaveClass("w-full");
  });

  it("hides completed milestones behind a disclosure and prioritizes active keyboard selection", () => {
    const setMilestone = jest.fn();

    render(
      <MilestoneField
        milestone={null}
        setMilestone={setMilestone}
        milestones={[
          { id: "completed", name: "Completed milestone", status: "done" },
          { id: "active", name: "Active milestone", status: "pending" },
        ]}
        onSearch={async () => undefined}
        testId="milestone-field"
      />,
    );

    openMilestoneField();

    const options = Array.from(document.querySelectorAll('[data-test-id^="milestone-field-search-result-"]'));

    expect(options.map((option) => option.getAttribute("data-test-id"))).toEqual([
      "milestone-field-search-result-active-milestone",
    ]);
    expect(queryByTestId("milestone-field-search-result-completed-milestone")).not.toBeInTheDocument();
    expect(getByTestId("milestone-field-completed-milestones-toggle")).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

    expect(setMilestone).toHaveBeenCalledWith({ id: "active", name: "Active milestone", status: "pending" });
  });

  it("keeps completed milestones selectable", () => {
    const setMilestone = jest.fn();

    render(
      <MilestoneField
        milestone={null}
        setMilestone={setMilestone}
        milestones={[{ id: "completed", name: "Completed milestone", status: "done" }]}
        onSearch={async () => undefined}
      />,
    );

    openMilestoneField();

    const completedMilestonesToggle = getByTestId("milestone-field-completed-milestones-toggle");
    fireEvent.click(completedMilestonesToggle);

    expect(completedMilestonesToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(getByTestId("milestone-field-search-result-completed-milestone"));

    expect(setMilestone).toHaveBeenCalledWith({ id: "completed", name: "Completed milestone", status: "done" });
  });
});
