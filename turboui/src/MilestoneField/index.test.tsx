import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MilestoneField } from "./index";

const milestones = [{ id: "m-1", name: "Launch" }];

describe("MilestoneField", () => {
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
});
