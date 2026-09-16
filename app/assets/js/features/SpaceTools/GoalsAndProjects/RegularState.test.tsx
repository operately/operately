/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { PieChart } from "turboui";
import { Goal, Project, Space } from "@/api";
import { RegularState } from "./RegularState";

jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({ PieChart: jest.fn(() => null) }));

it("recomputes goal rows, progress, and status counts when cached tools change", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  const goal = { id: "goal", name: "Original", progressPercentage: 0, lastCheckIn: null } as Goal;
  const project = { id: "project", name: "Project", milestones: [], lastCheckIn: null } as unknown as Project;

  const render = (goals: Goal[], projects: Project[]) => {
    jest.mocked(PieChart).mockClear();

    act(() =>
      root.render(<RegularState title="Work" space={{ id: "space" } as Space} goals={goals} projects={projects} />),
    );
  };

  const chartPercentages = () =>
    jest.mocked(PieChart).mock.calls.map(([props]) => props.slices.map((slice) => slice.percentage));

  // Slice order: on track, caution, off track, pending, paused.
  const pending = [0, 0, 0, 100, 0];
  const onTrack = [100, 0, 0, 0, 0];

  try {
    render([goal], [project]);

    expect(chartPercentages()).toEqual([pending, pending]);

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
    expect(chartPercentages()).toEqual([onTrack, onTrack]);
    expect(container.querySelector('[style*="width: 50%"]')).not.toBeNull();

    render([], [project]);

    expect(chartPercentages()).toEqual([pending]);
    expect(container.textContent).not.toContain("Renamed");

    render([goal], [project]);

    expect(container.textContent).toContain("Original");
    expect(chartPercentages()).toEqual([pending, pending]);
  } finally {
    act(() => root.unmount());
  }
});
