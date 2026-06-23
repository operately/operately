import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

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
  it("renders completed milestones after the no milestone section and keeps their tasks collapsed", () => {
    const { container } = renderTaskBoard();
    const board = container.querySelector('[data-test-id="tasks-board"]');
    const completedBoard = container.querySelector('[data-test-id="completed-milestones-board"]');
    const completedMilestoneCard = container.querySelector('[data-test-id="milestone-completed-milestone"]');

    expect(board).not.toBeNull();
    expect(completedBoard).not.toBeNull();
    expect(completedMilestoneCard).not.toBeNull();

    const openMilestoneHeading = screen.getByText("Open Milestone");
    const noMilestoneHeading = screen.getByText("No milestone");
    const completedSectionHeading = screen.getByText("Completed milestones");
    const completedMilestoneHeading = screen.getByText("Completed Milestone");

    expect(openMilestoneHeading.compareDocumentPosition(noMilestoneHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(noMilestoneHeading.compareDocumentPosition(completedSectionHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(completedSectionHeading.compareDocumentPosition(completedMilestoneHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(board?.contains(completedSectionHeading)).toBe(false);
    expect(board?.contains(completedMilestoneHeading)).toBe(false);
    expect(completedBoard?.contains(completedSectionHeading)).toBe(true);
    expect(completedBoard?.contains(completedMilestoneHeading)).toBe(true);

    expect(screen.getByText("Show 1 completed task")).toBeInTheDocument();
    expect(screen.queryByText("Closed task in completed milestone")).not.toBeInTheDocument();
    expect(screen.queryByText(/click \+ or press c to add a task/i)).not.toBeInTheDocument();
    expect(completedMilestoneCard?.querySelector('[data-testid="icon-IconFlagFilled"]')).not.toBeNull();
    expect(completedMilestoneCard?.querySelector(".text-content-error")).toBeNull();
  });
});
