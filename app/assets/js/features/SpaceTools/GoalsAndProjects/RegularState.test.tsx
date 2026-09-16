/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Goal, Project, Space } from "@/api";
import { RegularState } from "./RegularState";

jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({ PieChart: () => null }));

it("recomputes goal rows, progress, and status counts when cached tools change", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  const goal = { id: "goal", name: "Original", progressPercentage: 0, lastCheckIn: null } as Goal;
  const project = { id: "project", name: "Project", milestones: [], lastCheckIn: null } as unknown as Project;

  const render = (goals: Goal[], projects: Project[]) =>
    act(() =>
      root.render(<RegularState title="Work" space={{ id: "space" } as Space} goals={goals} projects={projects} />),
    );

  try {
    render([goal], [project]);

    expect(container.textContent).toContain("0/1 goals on track");
    expect(container.textContent).toContain("0/1 projects on track");

    render(
      [
        {
          ...goal,
          name: "Renamed",
          progressPercentage: 50,
          lastCheckIn: { status: "on_track" } as Goal["lastCheckIn"],
        },
      ],
      [{ ...project, lastCheckIn: { status: "on_track" } as Project["lastCheckIn"] }],
    );

    expect(container.textContent).toContain("Renamed");
    expect(container.textContent).not.toContain("Original");
    expect(container.textContent).toContain("1/1 goals on track");
    expect(container.textContent).toContain("1/1 projects on track");
    expect(container.querySelector('[style*="width: 50%"]')).not.toBeNull();

    render([], [project]);

    expect(container.textContent).not.toContain("goals on track");

    render([goal], [project]);

    expect(container.textContent).toContain("Original");
  } finally {
    act(() => root.unmount());
  }
});
