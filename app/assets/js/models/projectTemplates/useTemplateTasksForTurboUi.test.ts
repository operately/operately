import Api, { type ProjectTemplate, type ProjectTemplateMilestone, type ProjectTemplateTask } from "@/api";
import {
  mapTemplateTaskGraph,
  performTemplateMilestoneCreate,
  performTemplateMilestoneUpdate,
  performTemplatePersonCreate,
  performTemplatePersonUpdate,
  performTemplateStatusesChange,
  performTemplateTaskCreate,
  performTemplateTaskReorder,
  performTemplateTaskUpdate,
} from "./useTemplateTasksForTurboUi";
import type { TemplateTaskGraph } from "./optimisticUpdates";
import type { Mutate } from "./operations";

jest.mock("@/models/tasks", () => ({
  parseTaskStatusForTurboUi: (status: { id: string }) => ({
    ...status,
    icon: "circleDashed",
  }),
  parseTaskStatusesForTurboUi: (statuses: { id: string }[] | null | undefined) =>
    (statuses ?? []).map((status) => ({ ...status, icon: "circleDashed" })),
  serializeTaskStatus: (status: { id: string }) => ({ id: status.id }),
  serializeTaskStatuses: (statuses: { id: string }[]) => statuses.map((status) => ({ id: status.id })),
}));

jest.mock("turboui", () => ({
  parseContent: (value: string) => JSON.parse(value),
  showErrorToast: jest.fn(),
}));

jest.mock("@/routes/paths", () => ({
  compareIds: (left: string | null | undefined, right: string | null | undefined) => left === right,
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: {
      updateMilestoneAndOrdering: jest.fn(),
      updateTask: jest.fn(),
      updateTaskAssignees: jest.fn(),
      createTask: jest.fn(),
      createMilestone: jest.fn(),
      updateMilestone: jest.fn(),
      deleteTask: jest.fn(),
      deleteMilestone: jest.fn(),
      update: jest.fn(),
      createPerson: jest.fn(),
      updatePerson: jest.fn(),
      deletePerson: jest.fn(),
    },
  },
}));

const updateMilestoneAndOrdering = Api.project_templates.updateMilestoneAndOrdering as jest.Mock;
const updateTask = Api.project_templates.updateTask as jest.Mock;
const updateTaskAssignees = Api.project_templates.updateTaskAssignees as jest.Mock;
const createTask = Api.project_templates.createTask as jest.Mock;
const createMilestone = Api.project_templates.createMilestone as jest.Mock;
const updateMilestone = Api.project_templates.updateMilestone as jest.Mock;
const createPerson = Api.project_templates.createPerson as jest.Mock;
const updateTemplate = Api.project_templates.update as jest.Mock;

const taskStatus = {
  __typename: "task_status" as const,
  id: "todo",
  label: "To do",
  color: "gray" as const,
  index: 0,
  value: "todo",
  closed: false,
};

const doneStatus = {
  ...taskStatus,
  id: "done",
  label: "Done",
  value: "done",
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
    tasksKanbanState: "{}",
    tasksOrderingState: ["task-1", "task-2"],
    insertedAt: "2026-08-18T00:00:00Z",
    updatedAt: "2026-08-18T00:00:00Z",
    ...overrides,
  };
}

function template(
  overrides: Partial<ProjectTemplate> = {},
): Pick<
  ProjectTemplate,
  | "people"
  | "taskAssignments"
  | "tasks"
  | "milestones"
  | "milestonesOrderingState"
  | "tasksKanbanState"
  | "taskStatuses"
> {
  return {
    people: [],
    taskAssignments: [],
    tasks: [apiTask({ id: "task-1", name: "First" }), apiTask({ id: "task-2", name: "Second" })],
    milestones: [apiMilestone({ id: "milestone-1", title: "Kickoff" })],
    milestonesOrderingState: ["milestone-1"],
    tasksKanbanState: "{}",
    taskStatuses: [taskStatus],
    ...overrides,
  };
}

function mappedGraph() {
  return mapTemplateTaskGraph(
    template(),
    (personId) => `/people/${personId}`,
    (milestoneId) => `/milestones/${milestoneId}`,
  );
}

function succeedingMutate(): Mutate {
  return async (_message, operation) => {
    await operation();
    return true;
  };
}

function graphSession(graph: TemplateTaskGraph, mutate: Mutate = succeedingMutate()) {
  let current = graph;
  return {
    graph,
    templateId: "template-1",
    mutate,
    commit: (next: TemplateTaskGraph) => {
      current = next;
    },
    get current() {
      return current;
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("maps loader tasks, milestone ordering, and milestone list order", () => {
  const graph = mappedGraph();

  expect(graph.tasks.map((task) => task.id)).toEqual(["task-1", "task-2"]);
  expect(graph.milestonesOrderingState).toEqual(["milestone-1"]);
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
  const session = graphSession(mappedGraph());

  await expect(
    performTemplateTaskReorder({
      ...session,
      taskId: "task-1",
      milestoneId: "milestone-1",
      index: 1,
    }),
  ).resolves.toBe(true);

  expect(session.current.milestones[0]!.tasksOrderingState).toEqual(["task-2", "task-1"]);
  expect(updateMilestoneAndOrdering).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-1",
    index: 1,
  });
});

test("restores the snapshot when reorder persistence fails", async () => {
  const session = graphSession(mappedGraph(), jest.fn().mockResolvedValue(false));

  await expect(
    performTemplateTaskReorder({
      ...session,
      taskId: "task-1",
      milestoneId: "milestone-1",
      index: 1,
    }),
  ).resolves.toBe(false);

  expect(session.current.milestones[0]!.tasksOrderingState).toEqual(["task-1", "task-2"]);
  expect(updateMilestoneAndOrdering).not.toHaveBeenCalled();
});

test("keeps status, due offset, and assignees in the graph before persist", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  updateTaskAssignees.mockResolvedValue({ success: true });
  const session = graphSession(mappedGraph());
  const assignees = [
    {
      id: "person-1",
      person: { id: "person-1", fullName: "Ada", avatarUrl: null },
      role: "contributor" as const,
      responsibility: null,
      accessLevel: 70,
      active: true,
    },
  ];

  await expect(
    performTemplateTaskUpdate({
      ...session,
      taskId: "task-1",
      updates: { status: { ...doneStatus, icon: "circleDashed" }, dueOffsetDays: 5, assignees },
    }),
  ).resolves.toBe(true);

  expect(session.current.tasks[0]).toEqual(
    expect.objectContaining({
      id: "task-1",
      dueOffsetDays: 5,
      status: expect.objectContaining({ id: "done" }),
      assignees,
    }),
  );
  expect(updateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "template-1",
      taskId: "task-1",
      dueOffsetDays: 5,
      taskStatus: { id: "done" },
    }),
  );
  expect(updateTaskAssignees).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    assigneeIds: ["person-1"],
  });
});

test("restores the task when status persistence fails", async () => {
  const session = graphSession(mappedGraph(), jest.fn().mockResolvedValue(false));

  await expect(
    performTemplateTaskUpdate({
      ...session,
      taskId: "task-1",
      updates: { dueOffsetDays: 9 },
    }),
  ).resolves.toBe(false);

  expect(session.current.tasks[0]!.dueOffsetDays).toBeNull();
  expect(updateTask).not.toHaveBeenCalled();
});

test("creates a task with a server id and appends milestone ordering", async () => {
  createTask.mockResolvedValue({ task: apiTask({ id: "task-3", name: "Prepare agenda" }) });
  const session = graphSession(mappedGraph());

  await expect(
    performTemplateTaskCreate({
      ...session,
      task: {
        name: "Prepare agenda",
        description: {},
        milestoneId: "milestone-1",
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: { ...taskStatus, icon: "circleDashed" },
        reminders: [],
        assignees: [],
      },
    }),
  ).resolves.toBe(true);

  expect(session.current.tasks.map((task) => task.id)).toEqual(["task-1", "task-2", "task-3"]);
  expect(session.current.milestones[0]!.tasksOrderingState).toEqual(["task-1", "task-2", "task-3"]);
  expect(createTask).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "template-1",
      milestoneId: "milestone-1",
      name: "Prepare agenda",
    }),
  );
});

test("patches milestone title and due offset in the graph", async () => {
  updateMilestone.mockResolvedValue({ milestone: apiMilestone({ id: "milestone-1", title: "Launch" }) });
  const session = graphSession(mappedGraph());

  await expect(
    performTemplateMilestoneUpdate({
      ...session,
      milestoneId: "milestone-1",
      updates: { title: "Launch", dueOffsetDays: 14 },
    }),
  ).resolves.toBe(true);

  expect(session.current.milestones[0]).toEqual(
    expect.objectContaining({
      title: "Launch",
      dueOffsetDays: 14,
    }),
  );
  expect(updateMilestone).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "template-1",
      milestoneId: "milestone-1",
      title: "Launch",
      dueOffsetDays: 14,
    }),
  );
});

test("creates a milestone with the returned server id", async () => {
  createMilestone.mockResolvedValue({
    milestone: apiMilestone({ id: "milestone-2", title: "Ship", tasksOrderingState: [] }),
  });
  const session = graphSession(mappedGraph());

  await expect(
    performTemplateMilestoneCreate({
      ...session,
      milestone: { title: "Ship", description: {}, dueOffsetDays: 3 },
      milestoneLink: (milestoneId) => `/milestones/${milestoneId}`,
    }),
  ).resolves.toBe(true);

  expect(session.current.milestones.map((milestone) => milestone.id)).toEqual(["milestone-1", "milestone-2"]);
  expect(session.current.milestonesOrderingState).toEqual(["milestone-1", "milestone-2"]);
});

test("creates a contributor with the returned server id", async () => {
  createPerson.mockResolvedValue({ person: { id: "template-person-1" } });
  const session = graphSession(mappedGraph());
  const person = {
    person: { id: "person-1", fullName: "Ada", avatarUrl: null },
    role: "contributor" as const,
    responsibility: "Launch",
    accessLevel: 70,
  };

  await expect(performTemplatePersonCreate({ ...session, person })).resolves.toBe(true);

  expect(session.current.people).toEqual([expect.objectContaining({ id: "template-person-1", role: "contributor" })]);
  expect(createPerson).toHaveBeenCalledWith({
    templateId: "template-1",
    personId: "person-1",
    role: "contributor",
    responsibility: "Launch",
    accessLevel: 70,
  });
});

test("restores the contributor when an update fails", async () => {
  const session = graphSession(
    mapTemplateTaskGraph(
      template({
        people: [
          {
            __typename: "project_template_person",
            id: "template-person-1",
            role: "contributor",
            responsibility: "Launch",
            accessLevel: 70,
            active: true,
            person: { id: "person-1", fullName: "Ada", avatarUrl: null },
          } as never,
        ],
      }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
    jest.fn().mockResolvedValue(false),
  );

  await expect(
    performTemplatePersonUpdate({
      ...session,
      personId: "template-person-1",
      updates: { responsibility: "Updated" },
    }),
  ).resolves.toBe(false);

  expect(session.current.people[0]!.responsibility).toBe("Launch");
});

test("remaps tasks off a deleted workflow status", async () => {
  updateTemplate.mockResolvedValue({ template: { id: "template-1" } });
  const session = graphSession(
    mapTemplateTaskGraph(
      template({ taskStatuses: [taskStatus, { ...doneStatus, index: 1 }] }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
  );
  const nextStatuses = [{ ...doneStatus, icon: "circleDashed" as const, index: 0 }];

  await expect(
    performTemplateStatusesChange({
      ...session,
      nextStatuses,
      deletedStatusReplacements: { todo: "done" },
    }),
  ).resolves.toBe(true);

  expect(session.current.statuses.map((status) => status.id)).toEqual(["done"]);
  expect(session.current.tasks.every((task) => task.status.id === "done")).toBe(true);
});
