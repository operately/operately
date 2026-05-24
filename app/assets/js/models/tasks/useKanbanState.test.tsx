import { buildTaskStatusChangeKanbanEvent } from "./useKanbanState";
import type { KanbanState } from "./parseKanbanState";

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
