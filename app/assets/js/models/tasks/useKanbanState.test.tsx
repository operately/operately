/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { act, renderHook } from "@/__tests__/renderHook";
import Api from "@/api";
import { useKanbanState } from "./useKanbanState";
import { buildTaskStatusChangeKanbanEvent } from "./useKanbanState";
import type { KanbanState } from "./parseKanbanState";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  compareIds: (a: string, b: string) => a === b,
  includesId: (ids: string[], id: string) => ids.includes(id),
}));
jest.mock("./index", () => ({ serializeTaskStatus: (status: unknown) => status }));

describe("buildTaskStatusChangeKanbanEvent", () => {
  test("puts a task completed from the board at the top of the done column", () => {
    const kanbanState: KanbanState = {
      pending: ["task-1"],
      done: ["task-2"],
      canceled: [],
    };

    const event = buildTaskStatusChangeKanbanEvent({
      taskId: "task-1",
      nextStatus: status("done", "Done", true, "green"),
      kanbanState,
      statuses: [
        status("pending", "Not started", false, "gray"),
        status("done", "Done", true, "green"),
        status("canceled", "Canceled", true, "red"),
      ],
      tasks: [task("task-1", "pending"), task("task-2", "done")],
    });

    expect(event?.from).toEqual({ status: "pending", index: 0 });
    expect(event?.to).toEqual({ status: "done", index: 0 });
    expect(event?.updatedKanbanState).toEqual({
      pending: [],
      done: ["task-1", "task-2"],
      canceled: [],
    });
  });

  test("uses closed status state, not status color, to decide top insertion", () => {
    const kanbanState: KanbanState = {
      pending: ["task-1"],
      done: ["task-2"],
    };

    const event = buildTaskStatusChangeKanbanEvent({
      taskId: "task-1",
      nextStatus: status("done", "Done", true, "blue"),
      kanbanState,
      statuses: [status("pending", "Not started", false, "gray"), status("done", "Done", true, "blue")],
      tasks: [task("task-1", "pending"), task("task-2", "done")],
    });

    expect(event?.to).toEqual({ status: "done", index: 0 });
    expect(event?.updatedKanbanState.done).toEqual(["task-1", "task-2"]);
  });
});

function task(id: string, statusValue: string) {
  return {
    id,
    title: id,
    status: status(statusValue, statusValue, false, "gray"),
  } as any;
}

function status(value: string, label: string, closed: boolean, color: string) {
  return {
    id: value,
    value,
    label,
    closed,
    color,
    index: 0,
  } as any;
}

it.each(["space", "template", "project"] as const)("keeps %s Kanban persistence compatible", async (type) => {
  const save = jest.fn().mockResolvedValue({});
  const templateTask = jest.spyOn(Api.project_templates, "updateTask").mockImplementation(save);
  const templateBoard = jest.spyOn(Api.project_templates, "update").mockImplementation(save);
  const options = {
    initialRawState: { pending: ["a"], done: [] },
    statuses: [status("pending", "Pending", false, "gray"), status("done", "Done", true, "green")],
    tasks: [task("a", "pending")],
  };
  const { result } = renderHook(
    () =>
      useKanbanState(
        type === "project"
          ? { ...options, type, projectId: "p1", updateKanban: save }
          : type === "space"
            ? { ...options, type, spaceId: "s1", updateKanban: save }
            : { ...options, type, templateId: "t1" },
      ),
    { initialProps: {} },
  );
  try {
    await act(async () => {
      expect(await result.current.handleTaskStatusChange("a", options.statuses[1])).toBe(true);
    });
    expect(save).toHaveBeenCalledTimes(type === "template" ? 2 : 1);
    if (type === "project")
      expect(save.mock.calls[0][0]).toMatchObject({
        projectId: "p1",
        taskId: "a",
        kanbanState: '{"pending":[],"done":["a"]}',
      });
  } finally {
    templateTask.mockRestore();
    templateBoard.mockRestore();
  }
});
