import { applyTaskMove } from "./listOrdering";

jest.mock("@/routes/paths", () => ({
  compareIds: (left: string | null | undefined, right: string | null | undefined) => left === right,
}));

test("moves a task within the same milestone", () => {
  const next = applyTaskMove(
    {
      tasks: [
        { id: "task-1", milestoneId: "milestone-1" },
        { id: "task-2", milestoneId: "milestone-1" },
        { id: "task-3", milestoneId: "milestone-1" },
      ],
      milestones: [{ id: "milestone-1", tasksOrderingState: ["task-1", "task-2", "task-3"] }],
    },
    "task-1",
    "milestone-1",
    2,
  );

  expect(next.milestones[0]!.tasksOrderingState).toEqual(["task-2", "task-3", "task-1"]);
  expect(next.tasks.find((task) => task.id === "task-1")?.milestoneId).toBe("milestone-1");
});

test("moves a task to another milestone", () => {
  const next = applyTaskMove(
    {
      tasks: [
        { id: "task-1", milestoneId: "milestone-1" },
        { id: "task-2", milestoneId: "milestone-1" },
        { id: "task-3", milestoneId: "milestone-2" },
      ],
      milestones: [
        { id: "milestone-1", tasksOrderingState: ["task-1", "task-2"] },
        { id: "milestone-2", tasksOrderingState: ["task-3"] },
      ],
    },
    "task-1",
    "milestone-2",
    1,
  );

  expect(next.tasks.find((task) => task.id === "task-1")?.milestoneId).toBe("milestone-2");
  expect(next.milestones.find((milestone) => milestone.id === "milestone-1")?.tasksOrderingState).toEqual(["task-2"]);
  expect(next.milestones.find((milestone) => milestone.id === "milestone-2")?.tasksOrderingState).toEqual([
    "task-3",
    "task-1",
  ]);
});

test("moves a task from a milestone to the root list", () => {
  const next = applyTaskMove(
    {
      tasks: [
        { id: "task-1", milestoneId: "milestone-1" },
        { id: "task-2", milestoneId: "milestone-1" },
      ],
      milestones: [{ id: "milestone-1", tasksOrderingState: ["task-1", "task-2"] }],
    },
    "task-1",
    null,
    0,
  );

  expect(next.tasks.find((task) => task.id === "task-1")?.milestoneId).toBeNull();
  expect(next.milestones[0]!.tasksOrderingState).toEqual(["task-2"]);
});

test("moves a task from the root list onto a milestone", () => {
  const next = applyTaskMove(
    {
      tasks: [
        { id: "task-1", milestoneId: null },
        { id: "task-2", milestoneId: "milestone-1" },
      ],
      milestones: [{ id: "milestone-1", tasksOrderingState: ["task-2"] }],
    },
    "task-1",
    "milestone-1",
    0,
  );

  expect(next.tasks.find((task) => task.id === "task-1")?.milestoneId).toBe("milestone-1");
  expect(next.milestones[0]!.tasksOrderingState).toEqual(["task-1", "task-2"]);
});

test("skips closed tasks when inserting into ordering", () => {
  const next = applyTaskMove(
    {
      tasks: [
        { id: "task-1", milestoneId: "milestone-1" },
        { id: "task-2", milestoneId: "milestone-1" },
        { id: "task-3", milestoneId: "milestone-1" },
      ],
      milestones: [{ id: "milestone-1", tasksOrderingState: ["task-1", "task-2", "task-3"] }],
    },
    "task-1",
    "milestone-1",
    2,
    { include: (task) => task.id !== "task-3" },
  );

  expect(next.milestones[0]!.tasksOrderingState).toEqual(["task-2", "task-1"]);
});

test("returns the original graph when the task is missing", () => {
  const graph = {
    tasks: [{ id: "task-1", milestoneId: "milestone-1" }],
    milestones: [{ id: "milestone-1", tasksOrderingState: ["task-1"] }],
  };

  expect(applyTaskMove(graph, "missing", "milestone-1", 0)).toBe(graph);
});
