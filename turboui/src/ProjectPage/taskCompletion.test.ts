import * as Types from "../TaskBoard/types";
import { getTaskCompletionStats } from "./taskCompletion";

const todo: Types.Status = {
  id: "todo",
  value: "todo",
  label: "Todo",
  color: "gray",
  icon: "circleDashed",
  index: 0,
  closed: false,
};

const done: Types.Status = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 1,
  closed: true,
};

const canceled: Types.Status = {
  id: "canceled",
  value: "canceled",
  label: "Canceled",
  color: "red",
  icon: "circleX",
  index: 2,
  closed: true,
};

function task(id: string, status: Types.Status | null, extras: Partial<Types.Task> = {}): Types.Task {
  return {
    id,
    title: id,
    status,
    description: null,
    link: "#",
    milestone: null,
    dueDate: null,
    type: "project",
    ...extras,
  };
}

describe("getTaskCompletionStats", () => {
  it("returns null when there are no tracked tasks", () => {
    expect(getTaskCompletionStats([])).toBeNull();
    expect(getTaskCompletionStats([task("helper", todo, { _isHelperTask: true })])).toBeNull();
  });

  it("excludes canceled tasks from the completion total", () => {
    expect(getTaskCompletionStats([task("todo", todo), task("done", done), task("canceled", canceled)])).toEqual({
      completedCount: 1,
      totalCount: 2,
      percentage: 50,
    });
  });

  it("excludes open tasks parked in completed milestones", () => {
    const completedMilestone: Types.Milestone = {
      id: "completed-milestone",
      name: "Completed milestone",
      status: "done",
      dueDate: null,
      link: "#",
    };

    expect(
      getTaskCompletionStats([
        task("visible-todo", todo),
        task("hidden-todo", todo, { milestone: completedMilestone }),
        task("historical-done", done, { milestone: completedMilestone }),
      ]),
    ).toEqual({
      completedCount: 1,
      totalCount: 2,
      percentage: 50,
    });
  });

  it("supports legacy completed task values", () => {
    const completed: Types.Status = {
      ...done,
      id: "completed",
      value: "completed",
      label: "Completed",
    };

    expect(getTaskCompletionStats([task("todo", todo), task("completed", completed)])).toEqual({
      completedCount: 1,
      totalCount: 2,
      percentage: 50,
    });
  });
});
