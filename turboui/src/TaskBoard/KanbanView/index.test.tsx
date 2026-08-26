import React from "react";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KanbanBoard } from ".";
import type { KanbanBoardProps } from "./types";
import type { TaskBoard } from "../components";
import type { StatusSelector } from "../../StatusSelector";

const search = {
  params: new URLSearchParams("taskId=task-1"),
};

jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  const setSearchParams = jest.fn((next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams)) => {
    if (typeof next === "function") next(new URLSearchParams(search.params));
  });

  return {
    ...actual,
    useSearchParams: () => [search.params, setSearchParams],
  };
});

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  useBoardDnD: () => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  }),
  useSortableList: () => undefined,
}));

jest.mock("./Kanban", () => ({
  Kanban: () => <div data-test-id="kanban-columns" />,
}));

jest.mock("./TaskSlideIn", () => ({
  TaskSlideIn: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-test-id="task-slide-in">
        <button type="button" data-test-id="slide-in-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
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
    dueOffsetDays: 12,
    type: "project",
    ...overrides,
  };
}

function boardProps(tasks: TaskBoard.Task[]): KanbanBoardProps {
  return {
    tasks,
    statuses: [pendingStatus],
    kanbanState: { pending: tasks.map((task) => task.id) },
    canEdit: true,
    getTaskPageProps: () => ({ variant: "template", name: "Publish announcement" }) as never,
  };
}

describe("KanbanBoard task slide-in", () => {
  beforeEach(() => {
    search.params = new URLSearchParams("taskId=task-1");
  });

  it("does not reopen the slide-in when tasks are remapped before the URL catches up", () => {
    const view = render(<KanbanBoard {...boardProps([makeTask()])} />);

    expect(document.querySelector('[data-test-id="task-slide-in"]')).toBeInTheDocument();

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-test-id="slide-in-close-button"]')?.click();
    });
    expect(document.querySelector('[data-test-id="task-slide-in"]')).not.toBeInTheDocument();

    view.rerender(<KanbanBoard {...boardProps([makeTask()])} />);
    expect(document.querySelector('[data-test-id="task-slide-in"]')).not.toBeInTheDocument();
  });
});
