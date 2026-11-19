import { sortPersonalTasks } from "./taskOrdering";
import { mockTasksTabItems } from "../WorkMap/tests/mockData";
import { sortTasksByDueDateAndAssignmentDate } from "../WorkMap/utils/sort";

test("keeps automatic sorting until an order is saved", () => {
  expect(sortPersonalTasks(mockTasksTabItems, [])).toEqual(sortTasksByDueDateAndAssignmentDate(mockTasksTabItems));
});

test("honors saved order, ignores missing tasks and appends new tasks in automatic order", () => {
  const sorted = sortTasksByDueDateAndAssignmentDate(mockTasksTabItems);
  const last = sorted[sorted.length - 1];
  if (!last) throw new Error("Expected task fixtures");
  expect(sortPersonalTasks(mockTasksTabItems, ["deleted", last.id])).toEqual([
    last,
    ...sorted.filter((item) => item.id !== last.id),
  ]);
});

test("a renamed task retains its position and duplicate IDs do not duplicate rows", () => {
  const template = mockTasksTabItems[0];
  if (!template) throw new Error("Expected task fixtures");
  const a = { ...template, id: "renamed-abc", name: "Z" };
  const b = { ...template, id: "other-def", name: "A" };
  expect(sortPersonalTasks([b, a], ["abc", "old-abc"])).toEqual([a, b]);
});
