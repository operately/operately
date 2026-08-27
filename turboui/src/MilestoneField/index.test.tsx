import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MilestoneField } from "./index";

const milestones = [{ id: "m-1", name: "Launch" }];

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
    expect(trigger).toHaveTextContent("No milestone");
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

    fireEvent.click(screen.getByText("Select milestone"));

    const options = Array.from(document.querySelectorAll('[data-test-id^="milestone-field-search-result-"]'));

    expect(options.map((option) => option.textContent)).toEqual(["Active milestone"]);
    expect(screen.queryByText("Completed milestone")).not.toBeInTheDocument();
    expect(screen.getByText("1 completed milestone")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText("Find or create milestone..."), { key: "Enter" });

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

    fireEvent.click(screen.getByText("Select milestone"));
    fireEvent.click(screen.getByText("1 completed milestone"));
    fireEvent.click(screen.getByText("Completed milestone"));

    expect(setMilestone).toHaveBeenCalledWith({ id: "completed", name: "Completed milestone", status: "done" });
  });
});
