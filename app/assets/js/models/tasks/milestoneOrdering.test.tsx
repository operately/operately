import { TaskBoard } from "turboui";

import { normalizeMilestonesOrderingState } from "./milestoneOrdering";

test("should normalize ordering state to visible tasks only", () => {
  const milestones = [createMilestone("milestone-1", ["task-3", "task-1"])];

  const tasks = [
    createTask("task-1", "milestone-1"),
    createTask("task-2", "milestone-1"),
    createTask("task-3", "milestone-1", { closed: true }),
  ];

  const normalized = normalizeMilestonesOrderingState(milestones, tasks);

  expect(normalized[0]?.tasksOrderingState).toEqual(["task-1", "task-2"]);
});

const createTask = (id: string, milestoneId: string | null, options: { closed?: boolean } = {}): TaskBoard.Task => ({
  id,
  title: `Task ${id}`,
  status: options.closed ? createStatus(true) : null,
  description: null,
  link: "",
  assignees: [],
  milestone: milestoneId
    ? {
        id: milestoneId,
        name: `Milestone ${milestoneId}`,
        status: "pending" as const,
        dueDate: null,
        link: "#",
        tasksOrderingState: [],
      }
    : null,
  dueDate: null,
  hasDescription: false,
  hasComments: false,
  commentCount: 0,
  comments: undefined,
  type: "project",
  _isHelperTask: false,
});

const createMilestone = (id: string, taskIds: string[]): TaskBoard.Milestone => ({
  id,
  name: `Milestone ${id}`,
  status: "pending" as const,
  dueDate: null,
  link: "#",
  tasksOrderingState: taskIds,
});

const createStatus = (closed: boolean): TaskBoard.Status => ({
  id: closed ? "done" : "pending",
  label: closed ? "Done" : "Pending",
  icon: "circleCheck",
  color: closed ? "green" : "gray",
  index: closed ? 1 : 0,
  value: closed ? "done" : "pending",
  closed,
});
