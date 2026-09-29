import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ProjectProgressSummary } from "./ProjectProgressSummary";
import { mockProjectMilestones } from "../../tests/mockData";
import { i18n, setupTestCatalog } from "../../../../test/i18n";

setupTestCatalog();

describe("ProjectProgressSummary", () => {
  it.each([0, 1, 2])("preserves English progress for %i milestones with missing Portuguese", async (count) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage("pt-BR");
    render(<ProjectProgressSummary milestones={mockProjectMilestones.slice(0, count)} />);
    expect(screen.getByTestId("project-progress-summary-content")).toHaveTextContent(
      count === 0 ? "No milestones" : count === 1 ? "1/1 completed (100%)" : "1/2 completed (50%)",
    );
  });

  it("looks up the complete progress summary", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "{{completed}}/{{total}} completed ({{percentage}}%)": "Translated {{percentage}}%: {{completed}} of {{total}}",
      },
      true,
      true,
    );
    render(<ProjectProgressSummary milestones={mockProjectMilestones} />);
    expect(screen.getByText("Translated 50%: 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Ship design")).toBeInTheDocument();
  });

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
