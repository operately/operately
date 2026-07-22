import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ProjectProgressSummary } from "./ProjectProgressSummary";
import { mockProjectMilestones } from "../../tests/mockData";

describe("ProjectProgressSummary", () => {
  it("shows empty state when there are no milestones", () => {
    render(<ProjectProgressSummary milestones={[]} />);

    expect(screen.getByText("No milestones")).toBeInTheDocument();
  });

  it("renders milestone completion summary and item states", () => {
    render(<ProjectProgressSummary milestones={mockProjectMilestones} />);

    expect(screen.getByTestId("project-progress-summary-content")).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("1/2 completed (50%)")).toBeInTheDocument();
    expect(screen.getByText("Ship design")).toBeInTheDocument();
    expect(screen.getByText("Launch beta")).toBeInTheDocument();
  });
});
