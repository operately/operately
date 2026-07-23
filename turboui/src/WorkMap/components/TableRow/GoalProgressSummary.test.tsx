import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { GoalProgressSummary } from "./GoalProgressSummary";
import { mockGoalChecklist, mockGoalTargets } from "../../tests/mockData";

describe("GoalProgressSummary", () => {
  it("shows empty state when there are no targets or checklist items", () => {
    render(<GoalProgressSummary targets={[]} checklist={[]} />);

    expect(screen.getByText("No targets or checklist")).toBeInTheDocument();
  });

  it("renders target names and value summaries", () => {
    render(<GoalProgressSummary targets={mockGoalTargets} checklist={[]} />);

    expect(screen.getByText("Targets")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("250 USD → 1,000 USD")).toBeInTheDocument();
    expect(screen.getByText("Retention")).toBeInTheDocument();
    expect(screen.getByText("40% → 100%")).toBeInTheDocument();
  });

  it("renders checklist completion summary and item states", () => {
    render(<GoalProgressSummary targets={[]} checklist={mockGoalChecklist} />);

    expect(screen.getByText("Checklist")).toBeInTheDocument();
    expect(screen.getByText("1/2 completed (50%)")).toBeInTheDocument();
    expect(screen.getByText("Launch plan")).toBeInTheDocument();
    expect(screen.getByText("Hire lead")).toBeInTheDocument();
  });

  it("renders both sections when targets and checklist are present", () => {
    render(<GoalProgressSummary targets={mockGoalTargets} checklist={mockGoalChecklist} />);

    expect(screen.getByTestId("goal-progress-summary-content")).toBeInTheDocument();
    expect(screen.getByText("Targets")).toBeInTheDocument();
    expect(screen.getByText("Checklist")).toBeInTheDocument();
    expect(screen.queryByText("No targets or checklist")).not.toBeInTheDocument();
  });

  it("sorts targets and checklist by index", () => {
    const unsortedTargets = [mockGoalTargets[1], mockGoalTargets[0]];
    const unsortedChecklist = [mockGoalChecklist[1], mockGoalChecklist[0]];

    render(<GoalProgressSummary targets={unsortedTargets} checklist={unsortedChecklist} />);

    const names = screen.getAllByText(/Revenue|Retention|Launch plan|Hire lead/).map((node) => node.textContent);
    expect(names).toEqual(["Revenue", "Retention", "Launch plan", "Hire lead"]);
  });
});
