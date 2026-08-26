import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Card } from "./Card";
import { OPEN_TASK_DUE_DATE_EVENT } from "../hooks/useTaskKeyboardNavigation";
import type { TaskBoard } from "../components";
import type { StatusSelector } from "../../StatusSelector";

const sortableRef: { current: HTMLElement | null } = { current: null };

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  DropIndicator: () => null,
  useSortableItem: () => ({
    ref: sortableRef,
    isDragging: false,
    closestEdge: null,
  }),
}));

const pendingStatus: StatusSelector.StatusOption = {
  id: "pending",
  value: "pending",
  label: "Not started",
  color: "gray",
  icon: "circleDashed",
  index: 0,
};

function makeTask(overrides: Partial<TaskBoard.Task> = {}): TaskBoard.Task {
  return {
    id: "task-1",
    title: "Publish announcement",
    status: pendingStatus,
    description: null,
    link: "#",
    milestone: null,
    dueDate: null,
    type: "project",
    ...overrides,
  };
}

function renderCard(overrides: Partial<React.ComponentProps<typeof Card>> = {}) {
  return render(
    <Card
      task={makeTask({ dueOffsetDays: 12 })}
      containerId="pending"
      index={0}
      draggedItemId={null}
      onTaskDueOffsetDaysChange={jest.fn()}
      {...overrides}
    />,
  );
}

function openDueDateShortcut() {
  const card = document.querySelector('[data-test-id="kanban-card-task-1"]');
  if (!card) throw new Error("kanban card not found");
  fireEvent(card, new Event(OPEN_TASK_DUE_DATE_EVENT, { bubbles: true, cancelable: true }));
}

describe("Kanban Card due date offset", () => {
  it("renders the relative due date instead of a calendar date", () => {
    renderCard();

    expect(screen.getByText("12 days after project starts")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="kanban-card-due-offset-task-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="kanban-card-due-date-task-1"]')).not.toBeInTheDocument();
  });

  it("opens the due date offset field from the keyboard shortcut event", () => {
    renderCard();

    openDueDateShortcut();

    expect(document.querySelector('[data-test-id="kanban-card-due-offset-task-1-input"]')).toBeInTheDocument();
  });

  it("does not open the due date offset field when it is read-only", () => {
    renderCard({ onTaskDueOffsetDaysChange: undefined });

    openDueDateShortcut();

    expect(document.querySelector('[data-test-id="kanban-card-due-offset-task-1-input"]')).not.toBeInTheDocument();
  });

  it("saves a due date offset from the field", () => {
    const onTaskDueOffsetDaysChange = jest.fn();
    renderCard({ onTaskDueOffsetDaysChange });

    openDueDateShortcut();
    const input = document.querySelector('[data-test-id="kanban-card-due-offset-task-1-input"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "18" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onTaskDueOffsetDaysChange).toHaveBeenCalledWith("task-1", 18);
  });

  it("keeps a calendar due date on project tasks", () => {
    renderCard({
      task: makeTask(),
      onTaskDueOffsetDaysChange: undefined,
      onTaskDueDateChange: jest.fn(),
    });

    expect(document.querySelector('[data-test-id="kanban-card-due-date-task-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="kanban-card-due-offset-task-1"]')).not.toBeInTheDocument();
  });
});
