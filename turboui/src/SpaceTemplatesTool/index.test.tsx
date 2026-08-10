import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SpaceTemplatesTool } from "./index";

describe("SpaceTemplatesTool", () => {
  test("renders a zero state with a prompt to create a template", () => {
    render(<SpaceTemplatesTool templates={[]} />);

    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Save reusable project structures for recurring work.")).toBeInTheDocument();
    expect(screen.getByText("Create a template")).toBeInTheDocument();
  });

  test("preserves server order, pluralizes counts, and limits the card to seven templates", () => {
    const templates = Array.from({ length: 8 }, (_, index) => ({
      id: `template-${index + 1}`,
      name: `Template ${index + 1}`,
      milestoneCount: index === 0 ? 1 : 2,
      taskCount: index === 0 ? 1 : 3,
    }));

    render(<SpaceTemplatesTool templates={templates} />);

    expect(screen.getByText("Template 1")).toBeInTheDocument();
    expect(screen.getByText("1 milestone · 1 task")).toBeInTheDocument();
    expect(screen.getByText("Template 7")).toBeInTheDocument();
    expect(screen.queryByText("Template 8")).not.toBeInTheDocument();
  });
});
