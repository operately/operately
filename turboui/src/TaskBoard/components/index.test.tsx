import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { DateField } from "../../DateField";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";
import * as Types from "../types";
import { TaskBoard } from "./index";

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  useBoardDnD: () => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  }),
  useSortableItem: () => ({
    ref: { current: null },
    isDragging: false,
  }),
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({
    items,
    placeholderIndex: null,
  }),
  SubtleDropPlaceholder: () => null,
}));

jest.mock("../../icons", () => {
  const React = require("react");

  return new Proxy(
    {},
    {
      get: (_target, prop) => (props: Record<string, unknown>) =>
        React.createElement("svg", { ...props, "data-testid": `icon-${String(prop)}` }),
    },
  );
});

const PENDING_STATUS: Types.Status = {
  id: "pending",
  value: "pending",
  label: "Not started",
  color: "gray",
  icon: "circleDashed",
  index: 0,
  closed: false,
};

const DONE_STATUS: Types.Status = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 1,
  closed: true,
};

const createDate = (value: string): DateField.ContextualDate => ({
  date: new Date(`${value}T00:00:00Z`),
  dateType: "day",
  value,
});

const openMilestone: Types.Milestone = {
  id: "open-milestone",
  name: "Open Milestone",
  status: "pending",
  dueDate: createDate("2030-01-15"),
  link: "#",
};

const completedMilestone: Types.Milestone = {
  id: "completed-milestone",
  name: "Completed Milestone",
  status: "done",
  dueDate: createDate("2024-01-15"),
  completedAt: new Date("2024-01-20T00:00:00Z"),
  link: "#",
};

const tasks: Types.Task[] = [
  {
    id: "open-task",
    title: "Open task",
    status: PENDING_STATUS,
    description: null,
    link: "#",
    milestone: openMilestone,
    dueDate: null,
    type: "project",
  },
  {
    id: "no-milestone-task",
    title: "No milestone task",
    status: PENDING_STATUS,
    description: null,
    link: "#",
    milestone: null,
    dueDate: null,
    type: "project",
  },
  {
    id: "completed-task",
    title: "Closed task in completed milestone",
    status: DONE_STATUS,
    description: null,
    link: "#",
    milestone: completedMilestone,
    dueDate: null,
    closedAt: new Date("2024-01-20T00:00:00Z"),
    type: "project",
  },
];

function renderTaskBoard() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TaskBoard
        tasks={tasks}
        milestones={[openMilestone, completedMilestone]}
        searchableMilestones={[openMilestone, completedMilestone]}
        onTaskCreate={jest.fn()}
        onTaskAssigneeChange={jest.fn()}
        onTaskDueDateChange={jest.fn()}
        onTaskStatusChange={jest.fn()}
        onMilestoneSearch={async () => {}}
        statuses={[PENDING_STATUS, DONE_STATUS]}
        onSaveCustomStatuses={jest.fn()}
        canManageStatuses={false}
        canCreateMilestone={false}
        canCreateTask={false}
        displayMode="list"
        onDisplayModeChange={jest.fn()}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );
}

describe("TaskBoard completed milestones", () => {
  it("renders compact completed milestones after active work and keeps them collapsed by default", () => {
    const { container } = renderTaskBoard();
    const board = container.querySelector('[data-test-id="tasks-board"]');
    const completedSection = container.querySelector('[data-test-id="completed-milestones-compact-section"]');

    expect(board).not.toBeNull();
    expect(completedSection).not.toBeNull();

    const openMilestoneHeading = screen.getByText("Open Milestone");
    const noMilestoneHeading = screen.getByText("No milestone");
    const completedSectionToggle = screen.getByRole("button", { name: "1 completed milestone" });

    expect(
      openMilestoneHeading.compareDocumentPosition(noMilestoneHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      noMilestoneHeading.compareDocumentPosition(completedSectionToggle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(completedSectionToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Completed Milestone")).not.toBeInTheDocument();

    fireEvent.click(completedSectionToggle);

    expect(completedSectionToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Completed Milestone")).toBeInTheDocument();
    expect(within(completedSection!).getByText("1 task")).toBeInTheDocument();
    expect(within(completedSection!).getByText("Completed Jan 20, 2024")).toBeInTheDocument();
    expect(completedSection?.querySelector('[data-test-id="milestone-add-task"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Closed task in completed milestone")).not.toBeInTheDocument();
    expect(screen.queryByText(/click \+ or press c to add a task/i)).not.toBeInTheDocument();
  });
});
