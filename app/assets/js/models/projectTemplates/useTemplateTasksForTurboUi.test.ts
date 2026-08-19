import Api, { type ProjectTemplate, type ProjectTemplateMilestone, type ProjectTemplateTask } from "@/api";
import { mapTemplateTaskGraph, performTemplateTaskReorder } from "./useTemplateTasksForTurboUi";

jest.mock("@/models/tasks", () => ({
  parseTaskStatusForTurboUi: (status: { id: string }) => ({
    ...status,
    icon: "circleDashed",
  }),
  parseTaskStatusesForTurboUi: (statuses: { id: string }[] | null | undefined) =>
    (statuses ?? []).map((status) => ({ ...status, icon: "circleDashed" })),
  serializeTaskStatus: (status: { id: string }) => ({ id: status.id }),
}));

jest.mock("turboui", () => ({
  parseContent: (value: string) => JSON.parse(value),
}));

jest.mock("@/routes/paths", () => ({
  compareIds: (left: string | null | undefined, right: string | null | undefined) => left === right,
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: {
      updateMilestoneAndOrdering: jest.fn(),
    },
  },
}));

const updateMilestoneAndOrdering = Api.project_templates.updateMilestoneAndOrdering as jest.Mock;

const taskStatus = {
  __typename: "task_status" as const,
  id: "todo",
  label: "To do",
  color: "gray",
  index: 0,
  value: "todo",
  closed: false,
};

function apiTask(
  overrides: Partial<ProjectTemplateTask> & Pick<ProjectTemplateTask, "id" | "name">,
): ProjectTemplateTask {
  return {
    __typename: "project_template_task",
    projectTemplateId: "template-1",
    projectTemplateMilestoneId: "milestone-1",
    description: "{}",
    reminders: [],
    taskStatus,
    insertedAt: "2026-08-18T00:00:00Z",
    updatedAt: "2026-08-18T00:00:00Z",
    ...overrides,
  };
}

function apiMilestone(
  overrides: Partial<ProjectTemplateMilestone> & Pick<ProjectTemplateMilestone, "id" | "title">,
): ProjectTemplateMilestone {
  return {
    __typename: "project_template_milestone",
    projectTemplateId: "template-1",
    tasksKanbanState: {},
    tasksOrderingState: ["task-1", "task-2"],
    insertedAt: "2026-08-18T00:00:00Z",
    updatedAt: "2026-08-18T00:00:00Z",
    ...overrides,
  };
}

function template(
  overrides: Partial<ProjectTemplate> = {},
): Pick<ProjectTemplate, "people" | "taskAssignments" | "tasks" | "milestones" | "tasksKanbanState" | "taskStatuses"> {
  return {
    people: [],
    taskAssignments: [],
    tasks: [apiTask({ id: "task-1", name: "First" }), apiTask({ id: "task-2", name: "Second" })],
    milestones: [apiMilestone({ id: "milestone-1", title: "Kickoff" })],
    tasksKanbanState: {},
    taskStatuses: [taskStatus],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("maps loader tasks and milestone ordering", () => {
  const graph = mapTemplateTaskGraph(
    template(),
    (personId) => `/people/${personId}`,
    (milestoneId) => `/milestones/${milestoneId}`,
  );

  expect(graph.tasks.map((task) => task.id)).toEqual(["task-1", "task-2"]);
  expect(graph.milestones).toEqual([
    expect.objectContaining({
      id: "milestone-1",
      title: "Kickoff",
      tasksOrderingState: ["task-1", "task-2"],
      link: "/milestones/milestone-1",
    }),
  ]);
});

test("keeps the optimistic order and persists milestone plus index", async () => {
  updateMilestoneAndOrdering.mockResolvedValue({ task: { id: "task-1" } });
  const graph = mapTemplateTaskGraph(
    template(),
    (personId) => `/people/${personId}`,
    (milestoneId) => `/milestones/${milestoneId}`,
  );
  let current = graph;
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });

  await expect(
    performTemplateTaskReorder({
      graph,
      templateId: "template-1",
      mutate,
      taskId: "task-1",
      milestoneId: "milestone-1",
      index: 1,
      commit: (next) => {
        current = next;
      },
    }),
  ).resolves.toBe(true);

  expect(current.milestones[0]!.tasksOrderingState).toEqual(["task-2", "task-1"]);
  expect(updateMilestoneAndOrdering).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-1",
    index: 1,
  });
});

test("restores the snapshot when reorder persistence fails", async () => {
  const graph = mapTemplateTaskGraph(
    template(),
    (personId) => `/people/${personId}`,
    (milestoneId) => `/milestones/${milestoneId}`,
  );
  let current = graph;
  const mutate = jest.fn().mockResolvedValue(false);

  await expect(
    performTemplateTaskReorder({
      graph,
      templateId: "template-1",
      mutate,
      taskId: "task-1",
      milestoneId: "milestone-1",
      index: 1,
      commit: (next) => {
        current = next;
      },
    }),
  ).resolves.toBe(false);

  expect(current.milestones[0]!.tasksOrderingState).toEqual(["task-1", "task-2"]);
  expect(updateMilestoneAndOrdering).not.toHaveBeenCalled();
});
