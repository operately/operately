import { act, renderHook } from "@testing-library/react";
import { useOptimisticTemplateTaskReorder } from "./useOptimisticTemplateTaskReorder";
import type { TemplateProjectPage } from ".";

const statuses: TemplateProjectPage.Props["statuses"] = [
  { id: "todo", value: "todo", label: "To do", color: "gray", icon: "circleDashed", index: 0 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 1, closed: true },
];

function task(
  overrides: Partial<TemplateProjectPage.Task> & Pick<TemplateProjectPage.Task, "id" | "name" | "milestoneId">,
): TemplateProjectPage.Task {
  return {
    description: null,
    priority: null,
    size: null,
    dueOffsetDays: null,
    reminders: [],
    status: statuses[0]!,
    ...overrides,
  };
}

test("reorders tasks immediately and keeps the optimistic order after success", async () => {
  const onTaskReorder = jest.fn().mockResolvedValue(true);
  const tasks = [
    task({ id: "task-1", name: "First", milestoneId: "milestone-1" }),
    task({ id: "task-2", name: "Second", milestoneId: "milestone-1" }),
  ];
  const { result } = renderHook(() =>
    useOptimisticTemplateTaskReorder({ tasks, statuses, onTaskReorder, enabled: true }),
  );

  await act(async () => {
    await result.current.handleTaskMove({
      itemId: "task-1",
      source: { containerId: "milestone-1", index: 0 },
      destination: { containerId: "milestone-1", index: 1 },
    });
  });

  expect(result.current.tasks.map((item) => item.id)).toEqual(["task-2", "task-1"]);
  expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-1", 1);
});

test("rolls back the optimistic order when reorder fails", async () => {
  const onTaskReorder = jest.fn().mockResolvedValue(false);
  const tasks = [
    task({ id: "task-1", name: "First", milestoneId: "milestone-1" }),
    task({ id: "task-2", name: "Second", milestoneId: "milestone-1" }),
  ];
  const { result } = renderHook(() =>
    useOptimisticTemplateTaskReorder({ tasks, statuses, onTaskReorder, enabled: true }),
  );

  await act(async () => {
    await result.current.handleTaskMove({
      itemId: "task-1",
      source: { containerId: "milestone-1", index: 0 },
      destination: { containerId: "milestone-1", index: 1 },
    });
  });

  expect(result.current.tasks.map((item) => item.id)).toEqual(["task-1", "task-2"]);
});
