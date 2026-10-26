import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KanbanBoard } from ".";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
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
  useBoardDnD: jest.fn(() => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  })),
  useSortableList: () => undefined,
}));

jest.mock("./Kanban", () => ({
  Kanban: (props: React.ComponentProps<typeof import("./Kanban").Kanban>) => (
    <div data-test-id="kanban-columns" data-can-edit={props.canEdit}>
      <button data-test-id="toggle-archive" onClick={() => props.archiveView?.onChange(!props.archiveView.archived)}>
        Switch
      </button>
      {props.statuses.map((status) => (
        <div key={status.value} data-test-id={`column-${status.value}`}>
          {(props.columns[status.value] ?? []).map((task) => (
            <span key={task.id} data-test-id={`task-${task.id}`} />
          ))}
        </div>
      ))}
    </div>
  ),
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

describe("KanbanBoard archive view", () => {
  const done = { ...pendingStatus, id: "done", value: "done", closed: true };
  const canceled = { ...done, id: "canceled", value: "canceled" };

  beforeEach(() => {
    search.params = new URLSearchParams();
  });

  it("separates active and archived cards and only shows occupied archive columns", () => {
    const tasks = [makeTask(), makeTask({ id: "archived", status: done, archivedAt: new Date() })];
    render(
      <KanbanBoard
        {...boardProps(tasks)}
        statuses={[pendingStatus, done, canceled]}
        kanbanState={{ pending: ["task-1"], done: ["archived"] }}
      />,
    );
    expect(document.querySelector('[data-test-id="task-task-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="task-archived"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="column-canceled"]')).toBeInTheDocument();

    fireEvent.click(getElement("toggle-archive"));
    expect(document.querySelector('[data-test-id="task-task-1"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="task-archived"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="column-pending"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="column-canceled"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="kanban-columns"]')).toHaveAttribute("data-can-edit", "false");

    fireEvent.click(getElement("toggle-archive"));
    expect(document.querySelector('[data-test-id="column-canceled"]')).toBeInTheDocument();
  });
});

it("maps visible drop positions to the full ordering without losing archived cards", () => {
  const status = { ...pendingStatus, id: "done", value: "done", closed: true };
  const tasks = [
    makeTask(),
    makeTask({ id: "archived", status, archivedAt: new Date() }),
    makeTask({ id: "visible", status }),
  ];
  const onTaskKanbanChange = jest.fn();
  render(
    <KanbanBoard
      {...boardProps(tasks)}
      statuses={[pendingStatus, status]}
      kanbanState={{ pending: ["task-1"], done: ["archived", "visible"] }}
      onTaskKanbanChange={onTaskKanbanChange}
    />,
  );
  const hook = jest.mocked(useBoardDnD);
  const move = hook.mock.calls[hook.mock.calls.length - 1]?.[0];
  if (!move) throw new Error("Missing drag handler");
  act(() =>
    move({
      itemId: "task-1",
      source: { containerId: "pending", index: 0 },
      destination: { containerId: "done", index: 1 },
    }),
  );
  expect(onTaskKanbanChange).toHaveBeenCalledWith(
    expect.objectContaining({
      to: { status: "done", index: 2 },
      updatedKanbanState: { pending: [], done: ["archived", "visible", "task-1"] },
    }),
  );
});

function getElement(testId: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Missing element: ${testId}`);
  return element;
}
