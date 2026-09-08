import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TasksSection } from "./TasksSection";
import type { ProjectPage } from ".";

jest.mock("../TaskBoard", () => ({
  TaskBoard: ({ tasks }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <span key={task.id}>{task.title}</span>
      ))}
    </div>
  ),
  TasksBoardView: () => <div data-testid="task-board" />,
  useMilestoneFilter: ({ tasks }) => ({ tasks, selectedMilestone: null, onMilestoneFilterChange: jest.fn() }),
  useTaskDisplayMode: ({ tasksView }) => [tasksView, jest.fn()],
}));
const state = { tasks: [], milestones: [], permissions: {}, tasksView: "list" } as unknown as ProjectPage.State;

it.each(["list", "board"])("shows a skeleton instead of an empty %s while tasks load", (tasksView) => {
  const props = { ...state, tasksView } as ProjectPage.State;
  const { rerender } = render(<TasksSection state={{ ...props, tasksLoading: true }} />);
  expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading tasks");
  expect(screen.queryByTestId("task-list")).not.toBeInTheDocument();
  expect(screen.queryByTestId("task-board")).not.toBeInTheDocument();
  rerender(<TasksSection state={props} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByTestId(tasksView === "list" ? "task-list" : "task-board")).toBeInTheDocument();
});

it("shows retry after failure and preserves existing tasks during a background failure", () => {
  const onRetryTasks = jest.fn();
  const props = { ...state, tasksError: true, onRetryTasks };
  const { rerender } = render(<TasksSection state={props} />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByTestId("task-list")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(onRetryTasks).toHaveBeenCalledTimes(1);
  rerender(
    <TasksSection state={{ ...props, tasks: [{ id: "task-1", title: "Existing task" } as ProjectPage.Task] }} />,
  );
  expect(screen.getByText("Existing task")).toBeInTheDocument();
});
