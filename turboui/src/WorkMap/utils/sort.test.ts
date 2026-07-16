import WorkMap from "../components";
import { sortTasksByDueDateAndAssignmentDate } from "./sort";

describe("sortTasksByDueDateAndAssignmentDate", () => {
  test("prioritizes due date over assignment date", () => {
    const items = [
      makeTask({ name: "Later due date", dueDate: "2026-02-01", assignedAt: "2026-03-01T00:00:00Z" }),
      makeTask({ name: "Earlier due date", dueDate: "2026-01-01", assignedAt: "2026-01-01T00:00:00Z" }),
    ];

    expect(sortTasksByDueDateAndAssignmentDate(items).map((item) => item.name)).toEqual([
      "Earlier due date",
      "Later due date",
    ]);
  });

  test("sorts tasks with the same due date by newest assignment first", () => {
    const items = [
      makeTask({ name: "Older assignment", dueDate: "2026-01-01", assignedAt: "2026-01-01T00:00:00Z" }),
      makeTask({ name: "Newer assignment", dueDate: "2026-01-01", assignedAt: "2026-01-02T00:00:00Z" }),
    ];

    expect(sortTasksByDueDateAndAssignmentDate(items).map((item) => item.name)).toEqual([
      "Newer assignment",
      "Older assignment",
    ]);
  });

  test("sorts tasks without due dates by newest assignment first", () => {
    const items = [
      makeTask({ name: "Older assignment", assignedAt: "2026-01-01T00:00:00Z" }),
      makeTask({ name: "Newer assignment", assignedAt: "2026-01-02T00:00:00Z" }),
    ];

    expect(sortTasksByDueDateAndAssignmentDate(items).map((item) => item.name)).toEqual([
      "Newer assignment",
      "Older assignment",
    ]);
  });

  test("uses the task name as a deterministic tie-breaker", () => {
    const items = [
      makeTask({ name: "Beta", dueDate: "2026-01-01", assignedAt: "2026-01-01T00:00:00Z" }),
      makeTask({ name: "Alpha", dueDate: "2026-01-01", assignedAt: "2026-01-01T00:00:00Z" }),
    ];

    expect(sortTasksByDueDateAndAssignmentDate(items).map((item) => item.name)).toEqual(["Alpha", "Beta"]);
  });
});

function makeTask(overrides: { name: string; dueDate?: string; assignedAt?: string }): WorkMap.Item {
  return {
    id: overrides.name,
    parentId: null,
    name: overrides.name,
    status: "pending",
    taskStatus: null,
    progress: 0,
    project: null,
    projectPath: null,
    space: null,
    spacePath: null,
    owner: null,
    ownerPath: null,
    reviewer: null,
    reviewerPath: null,
    nextStep: "",
    isNew: false,
    children: [],
    completedOn: null,
    timeframe: overrides.dueDate
      ? { startDate: null, endDate: { date: new Date(overrides.dueDate), dateType: "day", value: overrides.dueDate } }
      : null,
    assignedAt: overrides.assignedAt || null,
    milestones: [],
    type: "task",
    itemPath: `/${overrides.name}`,
    privacy: "internal",
  };
}
