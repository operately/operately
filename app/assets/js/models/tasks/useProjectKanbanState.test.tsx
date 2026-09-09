/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useProjectKanbanState } from "./useProjectKanbanState";
import type { TaskBoard } from "turboui";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  compareIds: (a: string, b: string) => a === b,
  includesId: (ids: string[], id: string) => ids.includes(id),
}));
jest.mock("./index", () => ({ serializeTaskStatus: (status: unknown) => status }));

const pending = { id: "pending", value: "pending", label: "Pending", color: "gray", index: 0 } as TaskBoard.Status;
const done = { ...pending, id: "done", value: "done" };
const statuses = [pending, done];
const tasks = [
  { id: "a", title: "A", status: pending },
  { id: "b", title: "B", status: pending },
] as TaskBoard.Task[];
const raw = { pending: ["a", "b"], done: [] };

function deferred() {
  let resolve: (v: unknown) => void = () => {};
  let reject: (v: Error) => void = () => {};
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it("keeps optimistic status through stale props and restores both values on failure", async () => {
  const request = deferred();
  const refresh = jest.fn();
  const { result, rerender } = renderHook(
    ({ incoming }) => {
      const [visible, setVisible] = React.useState(incoming);
      React.useEffect(() => setVisible(incoming), [incoming]);
      const queue = useProjectKanbanState({
        projectId: "p1",
        tasks: visible,
        statuses,
        initialRawState: raw,
        setTasks: setVisible,
        updateKanban: () => request.promise,
        onSuccess: refresh,
      });
      return { ...queue, tasks: visible };
    },
    { initialProps: { incoming: tasks } },
  );
  let saved: Promise<boolean> = Promise.resolve(false);
  act(() => {
    saved = result.current.move({ taskId: "a", status: done, index: 0 });
  });
  expect(result.current.kanbanState.done).toEqual(["a"]);
  expect(result.current.tasks[0]?.status).toEqual(done);
  rerender({ incoming: tasks.map((task) => ({ ...task })) });
  expect(result.current.tasks[0]?.status).toEqual(done);
  await act(async () => {
    request.reject(new Error("failed"));
    await saved;
  });
  expect(result.current.kanbanState).toEqual(raw);
  expect(result.current.tasks[0]?.status).toEqual(pending);
  expect(refresh).not.toHaveBeenCalled();
});

it.each(["switch", "unmount"])("ignores late UI and refresh callbacks after %s", async (action) => {
  const request = deferred();
  const refresh = jest.fn();
  const setTasks = jest.fn();
  const { result, rerender, unmount } = renderHook(
    ({ projectId }) =>
      useProjectKanbanState({
        projectId,
        tasks,
        statuses,
        initialRawState: raw,
        setTasks,
        updateKanban: () => request.promise,
        onSuccess: refresh,
      }),
    { initialProps: { projectId: "p1" } },
  );
  let saved: Promise<boolean> = Promise.resolve(false);
  act(() => {
    saved = result.current.move({ taskId: "a", status: done, index: 0 });
  });
  if (action === "switch") rerender({ projectId: "p2" });
  else unmount();
  setTasks.mockClear();
  await act(async () => {
    request.resolve({});
    await saved;
  });
  expect(refresh).not.toHaveBeenCalled();
  expect(setTasks).not.toHaveBeenCalled();
  if (action === "switch") await waitFor(() => expect(result.current.kanbanState).toEqual(raw));
});

it("reconciles tasks received during the final refresh after the queue drains", async () => {
  const request = deferred();
  const refresh = deferred();
  const { result, rerender } = renderHook(
    ({ incoming }) => {
      const [visible, setVisible] = React.useState(incoming);
      React.useEffect(() => setVisible(incoming), [incoming]);
      return useProjectKanbanState({
        projectId: "p1",
        tasks: visible,
        statuses,
        initialRawState: raw,
        setTasks: setVisible,
        updateKanban: () => request.promise,
        onSuccess: async () => {
          await refresh.promise;
        },
      });
    },
    { initialProps: { incoming: tasks } },
  );
  let saved = Promise.resolve(false);
  act(() => {
    saved = result.current.move({ taskId: "a", status: done, index: 0 });
  });
  await act(async () => {
    request.resolve({});
  });
  rerender({ incoming: [...tasks, { ...tasks[1], id: "c", title: "C", status: pending } as TaskBoard.Task] });
  await act(async () => {
    refresh.resolve({});
    await saved;
  });
  expect(result.current.kanbanState).toEqual({ pending: ["b", "c"], done: ["a"] });
});
