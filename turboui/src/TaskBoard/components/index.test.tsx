import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { DateField } from "../../DateField";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";
import * as Types from "../types";
import { TaskBoard } from "./index";
import { useBoardDnD, useSortableItem } from "../../utils/PragmaticDragAndDrop";

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  useBoardDnD: jest.fn(() => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  })),
  useSortableItem: jest.fn(() => ({
    ref: { current: null },
    isDragging: false,
  })),
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
  {
    id: "open-task-in-completed-milestone",
    title: "Open task in completed milestone",
    status: PENDING_STATUS,
    description: null,
    link: "#",
    milestone: completedMilestone,
    dueDate: null,
    type: "project",
  },
];

function renderTaskBoard(overrides: Partial<Types.TaskBoardProps> = {}) {
  return render(
    <MemoryRouter>
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
        {...overrides}
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
    const completedSectionToggle = screen.getByRole("button", { name: /1 completed milestone/ });

    expect(
      openMilestoneHeading.compareDocumentPosition(noMilestoneHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      noMilestoneHeading.compareDocumentPosition(completedSectionToggle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(completedSectionToggle).toHaveAttribute("aria-expanded", "false");
    expect(within(completedSection as HTMLElement).getByText("· 1 open task")).toBeInTheDocument();
    expect(screen.queryByText("Completed Milestone")).not.toBeInTheDocument();

    fireEvent.click(completedSectionToggle);

    expect(completedSectionToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Completed Milestone")).toBeInTheDocument();
    if (!(completedSection instanceof HTMLElement)) throw new Error("expected completed milestones section");
    expect(within(completedSection).getByText("2 tasks")).toBeInTheDocument();
    expect(within(completedSection).getByText("Completed Jan 20, 2024")).toBeInTheDocument();
    expect(completedSection?.querySelector('[data-test-id="milestone-add-task"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Closed task in completed milestone")).not.toBeInTheDocument();
    expect(screen.queryByText("Open task in completed milestone")).not.toBeInTheDocument();
    expect(screen.queryByText(/click \+ or press c to add a task/i)).not.toBeInTheDocument();
  });
});

test("boards without mutation callbacks hide creation and editing controls", () => {
  const { container } = renderTaskBoard({
    onTaskCreate: undefined,
    onTaskAssigneeChange: undefined,
    onTaskDueDateChange: undefined,
    onTaskStatusChange: undefined,
    onSaveCustomStatuses: undefined,
    canCreateTask: true,
    canCreateMilestone: true,
    canManageStatuses: true,
  });
  expect(
    container.querySelector(
      '[data-test-id="milestone-add-task"], [data-test-id="no-milestone-add-task"], [data-test-id="add-task"], [data-test-id="add-milestone"]',
    ),
  ).toBeNull();
  expect(container.querySelector('input, textarea, [contenteditable="true"]')).toBeNull();
  expect(container.querySelector('[data-test-id="task-open-task"] [data-test-id="task-status"]')).not.toHaveAttribute(
    "aria-haspopup",
  );
  expect(container.querySelector('[data-test-id="task-open-task"] [data-test-id="task-due-date"]')).toBeDisabled();
  expect(useBoardDnD).toHaveBeenLastCalledWith(expect.any(Function), { enabled: false });
  expect(useSortableItem).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: true }));
});

test("status editing works independently of creation, assignment, dates, and dragging", () => {
  const onTaskStatusChange = jest.fn();
  const { container } = renderTaskBoard({
    onTaskCreate: undefined,
    onTaskAssigneeChange: undefined,
    onTaskDueDateChange: undefined,
    onTaskStatusChange,
    assigneePersonSearch: { people: [], onSearch: jest.fn() },
  });
  const task = container.querySelector('[data-test-id="task-open-task"]');
  if (!(task instanceof HTMLElement)) throw new Error("Expected task row");

  const statusField = task.querySelector('[data-test-id="task-status"]');
  if (!(statusField instanceof HTMLElement)) throw new Error("Expected editable status field");
  expect(statusField).toHaveAttribute("aria-haspopup", "dialog");
  expect(task.querySelector('[data-test-id="task-due-date"]')).toBeDisabled();
  const assigneeField = task.querySelector('[data-test-id="assignees-field"]');
  if (!(assigneeField instanceof HTMLElement)) throw new Error("Expected assignees field");
  fireEvent.click(assigneeField);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(statusField);
  const option = document.querySelector('[data-test-id="status-option-done"]');
  if (!(option instanceof HTMLElement)) throw new Error("Expected status option");
  fireEvent.click(option);
  expect(onTaskStatusChange).toHaveBeenCalledWith("open-task", DONE_STATUS);
  expect(useBoardDnD).toHaveBeenLastCalledWith(expect.any(Function), { enabled: false });
});

test("creation and dragging are enabled by their callbacks", () => {
  const onTaskCreate = jest.fn();
  const { container } = renderTaskBoard({
    onTaskCreate,
    onTaskMilestoneChange: jest.fn(),
    canCreateTask: true,
    onTaskAssigneeChange: undefined,
    onTaskDueDateChange: undefined,
    onTaskStatusChange: undefined,
  });
  const addTask = container.querySelector('[data-test-id="no-milestone-add-task"]');
  if (!(addTask instanceof HTMLElement)) throw new Error("Expected creation control");
  fireEvent.click(addTask);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "New task" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onTaskCreate).toHaveBeenCalledWith(expect.objectContaining({ title: "New task", milestone: null }));
  expect(useBoardDnD).toHaveBeenLastCalledWith(expect.any(Function), { enabled: true });
  expect(useSortableItem).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: false }));
});
