/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { useState } from "react";
import { act, renderHook } from "@/__tests__/renderHook";
import { showErrorToast, type TaskBoard } from "turboui";
import { useTaskArchiveChange } from "./useTaskArchiveChange";

const mutateAsync = jest.fn();
jest.mock("./taskLifecycle", () => ({ useUpdateTaskArchive: () => ({ mutateAsync }) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));

const task: TaskBoard.Task = {
  id: "task-1",
  title: "Release",
  status: null,
  description: null,
  link: "/tasks/task-1",
  milestone: null,
  dueDate: null,
  type: "project",
};

function useHarness() {
  const [tasks, setTasks] = useState([task]);
  const updateArchive = useTaskArchiveChange(setTasks);
  return { tasks, updateArchive };
}

beforeEach(() => jest.clearAllMocks());

it("keeps the task's data and applies the saved archive timestamp", async () => {
  mutateAsync.mockResolvedValue({ task: { archivedAt: "2026-10-01T12:00:00Z" } });
  const hook = renderHook(useHarness, { initialProps: undefined });
  await act(async () => {
    expect(await hook.result.current.updateArchive(task.id, true)).toBe(true);
  });
  expect(hook.result.current.tasks).toEqual([{ ...task, archivedAt: new Date("2026-10-01T12:00:00Z") }]);
  mutateAsync.mockResolvedValue({ task: { archivedAt: null } });
  await act(async () => {
    expect(await hook.result.current.updateArchive(task.id, false)).toBe(true);
  });
  expect(hook.result.current.tasks).toEqual([{ ...task, archivedAt: null }]);
});

it("keeps a task on its board when saving fails and reports the error", async () => {
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  mutateAsync.mockRejectedValue(new Error("network unavailable"));
  const hook = renderHook(useHarness, { initialProps: undefined });
  try {
    await act(async () => {
      expect(await hook.result.current.updateArchive(task.id, true)).toBe(false);
    });
    expect(hook.result.current.tasks).toEqual([task]);
    expect(showErrorToast).toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
  }
});
