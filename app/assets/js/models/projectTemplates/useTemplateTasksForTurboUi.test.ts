/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import Api, { type ProjectTemplate, type ProjectTemplateMilestone, type ProjectTemplateTask } from "@/api";
import { useTemplateTasksForTurboUi } from "./useTemplateTasksForTurboUi";
import * as Operations from "./operations";
import { mapTemplateTaskGraph } from "./operations";
import type { TemplateTaskGraph } from "./optimisticUpdates";
import { act, renderHook } from "@/__tests__/renderHook";

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

jest.mock("@/routes/paths", () => {
  const compareIds = (left: string | null | undefined, right: string | null | undefined) => {
    if (!left || !right) return false;
    return left === right;
  };

  return {
    compareIds,
    includesId: (ids: string[], id: string) => ids.some((item) => compareIds(item, id)),
    sameMilestoneId: (left: string | null | undefined, right: string | null | undefined) => {
      if (left == null && right == null) return true;
      return compareIds(left, right);
    },
  };
});

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

jest.mock("@/models/tasks/useProjectKanbanState", () => ({
  useProjectKanbanState: () => ({}),
}));

jest.mock("./projectTemplateEditorLifecycle", () => {
  const api = jest.requireMock("@/api").default.project_templates;
  return {
    useCreateTemplateTask: () => ({ mutateAsync: api.createTask }),
    useUpdateTemplateTask: () => ({ mutateAsync: api.updateTask }),
    useUpdateTemplateTaskAssignees: () => ({ mutateAsync: api.updateTaskAssignees }),
    useDeleteTemplateTask: () => ({ mutateAsync: api.deleteTask }),
    useUpdateTemplateTaskMilestoneAndOrdering: () => ({ mutateAsync: api.updateMilestoneAndOrdering }),
    useCreateTemplateMilestone: () => ({ mutateAsync: api.createMilestone }),
    useUpdateTemplateMilestone: () => ({ mutateAsync: api.updateMilestone }),
    useDeleteTemplateMilestone: () => ({ mutateAsync: api.deleteMilestone }),
    useCreateTemplatePerson: () => ({ mutateAsync: api.createPerson }),
    useUpdateTemplatePerson: () => ({ mutateAsync: api.updatePerson }),
    useDeleteTemplatePerson: () => ({ mutateAsync: api.deletePerson }),
    useUpdateTemplate: () => ({ mutateAsync: api.update }),
  };
});

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

function graphSession(graph: TemplateTaskGraph) {
  jest.spyOn(Operations, "mapTemplateTaskGraph").mockReturnValue(graph);
  const input = {
    template: { ...template(), id: "template-1", space: { id: "space-1" } } as ProjectTemplate,
    profilePath: (id: string) => `/people/${id}`,
    milestoneLink: (id: string) => `/milestones/${id}`,
  };
  const { result } = renderHook(() => useTemplateTasksForTurboUi(input), { initialProps: undefined });

  return {
    async run(action: (editor: ReturnType<typeof useTemplateTasksForTurboUi>) => Promise<boolean>) {
      let saved = false;
      await act(async () => {
        saved = await action(result.current);
      });
      return saved;
    },
    get current() {
      return result.current;
    },
  };
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
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

  await expect(session.run((editor) => editor.onTaskReorder("task-1", "milestone-1", 1))).resolves.toBe(true);

  expect(session.current.milestones[0]!.tasksOrderingState).toEqual(["task-2", "task-1"]);
  expect(updateMilestoneAndOrdering).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-1",
    index: 1,
  });
});

test("restores the snapshot when reorder persistence fails", async () => {
  jest.mocked(updateMilestoneAndOrdering).mockRejectedValueOnce(new Error("Offline"));
  const session = graphSession(mappedGraph());

  await expect(session.run((editor) => editor.onTaskReorder("task-1", "milestone-1", 1))).resolves.toBe(false);

  expect(session.current.milestones[0]!.tasksOrderingState).toEqual(["task-1", "task-2"]);
  expect(updateMilestoneAndOrdering).toHaveBeenCalled();
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
    session.run((editor) =>
      editor.onTaskUpdate("task-1", { status: { ...doneStatus, icon: "circleDashed" }, dueOffsetDays: 5, assignees }),
    ),
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

test("moves the task between kanban columns when status changes", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  updateTemplate.mockResolvedValue({ template: { id: "template-1" } });
  const session = graphSession(
    mapTemplateTaskGraph(
      template({
        taskStatuses: [taskStatus, doneStatus],
        tasksKanbanState: JSON.stringify({ todo: ["task-1", "task-2"], done: [] }),
      }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
  );

  await expect(
    session.run((editor) => editor.onTaskUpdate("task-1", { status: { ...doneStatus, icon: "circleDashed" } })),
  ).resolves.toBe(true);

  expect(session.current.tasksKanbanState).toEqual({ todo: ["task-2"], done: ["task-1"] });
  expect(updateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "template-1",
      taskId: "task-1",
      taskStatus: { id: "done" },
    }),
  );
  expect(updateTemplate).not.toHaveBeenCalled();
});

test("restores the task when status persistence fails", async () => {
  jest.mocked(updateTask).mockRejectedValueOnce(new Error("Offline"));
  const session = graphSession(mappedGraph());

  await expect(session.run((editor) => editor.onTaskUpdate("task-1", { dueOffsetDays: 9 }))).resolves.toBe(false);

  expect(session.current.tasks[0]!.dueOffsetDays).toBeNull();
  expect(updateTask).toHaveBeenCalled();
});

test("persists template-root kanban state and status for a milestone task", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  updateTemplate.mockResolvedValue({ template: { id: "template-1" } });
  const session = graphSession(
    mapTemplateTaskGraph(
      template({ taskStatuses: [taskStatus, doneStatus] }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
  );
  const updatedKanbanState = { todo: ["task-2"], done: ["task-1"] };

  await expect(
    session.run((editor) =>
      editor.onTaskKanbanChange({
        milestoneId: null,
        taskId: "task-1",
        from: { status: "todo", index: 0 },
        to: { status: "done", index: 0 },
        updatedKanbanState,
      }),
    ),
  ).resolves.toBe(true);

  expect(session.current.tasks[0]).toEqual(
    expect.objectContaining({ id: "task-1", status: expect.objectContaining({ id: "done" }) }),
  );
  expect(session.current.tasksKanbanState).toEqual({ todo: ["task-2"], done: ["task-1"] });
  expect(updateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "template-1",
      taskId: "task-1",
      taskStatus: { id: "done" },
    }),
  );
  expect(updateTemplate).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "template-1",
      tasksKanbanState: JSON.stringify({ todo: ["task-2"], done: ["task-1"] }),
    }),
  );
  expect(updateMilestone).not.toHaveBeenCalled();
});

test("persists root kanban state for a template-root task", async () => {
  updateTask.mockResolvedValue({ task: { id: "root-task" } });
  updateTemplate.mockResolvedValue({ template: { id: "template-1" } });
  const session = graphSession(
    mapTemplateTaskGraph(
      template({
        tasks: [apiTask({ id: "root-task", name: "Root", projectTemplateMilestoneId: null })],
        milestones: [apiMilestone({ id: "milestone-1", title: "Kickoff", tasksOrderingState: [] })],
        tasksKanbanState: JSON.stringify({ todo: ["root-task"], done: [] }),
        taskStatuses: [taskStatus, doneStatus],
      }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
  );

  await expect(
    session.run((editor) =>
      editor.onTaskKanbanChange({
        milestoneId: null,
        taskId: "root-task",
        from: { status: "todo", index: 0 },
        to: { status: "done", index: 0 },
        updatedKanbanState: { todo: [], done: ["root-task"] },
      }),
    ),
  ).resolves.toBe(true);

  expect(session.current.tasksKanbanState).toEqual({ todo: [], done: ["root-task"] });
  expect(updateTemplate).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "template-1",
      tasksKanbanState: JSON.stringify({ todo: [], done: ["root-task"] }),
    }),
  );
  expect(updateMilestone).not.toHaveBeenCalled();
});

test("persists the full board order on the template root", async () => {
  updateTask.mockResolvedValue({ task: { id: "root-task" } });
  updateTemplate.mockResolvedValue({ template: { id: "template-1" } });
  const session = graphSession(
    mapTemplateTaskGraph(
      template({
        tasks: [
          apiTask({ id: "root-a", name: "Root A", projectTemplateMilestoneId: null }),
          apiTask({ id: "root-b", name: "Root B", projectTemplateMilestoneId: null }),
          apiTask({ id: "task-1", name: "Milestone task" }),
        ],
        milestones: [
          apiMilestone({
            id: "milestone-1",
            title: "Kickoff",
            tasksOrderingState: ["task-1"],
            tasksKanbanState: JSON.stringify({ todo: ["task-1"], done: [] }),
          }),
        ],
        tasksKanbanState: JSON.stringify({ todo: ["root-a", "task-1", "root-b"], done: [] }),
        taskStatuses: [taskStatus, doneStatus],
      }),
      (personId) => `/people/${personId}`,
      (milestoneId) => `/milestones/${milestoneId}`,
    ),
  );

  await expect(
    session.run((editor) =>
      editor.onTaskKanbanChange({
        milestoneId: null,
        taskId: "root-b",
        from: { status: "todo", index: 2 },
        to: { status: "todo", index: 0 },
        updatedKanbanState: { todo: ["root-b", "task-1", "root-a"], done: [] },
      }),
    ),
  ).resolves.toBe(true);

  expect(session.current.tasksKanbanState).toEqual({ todo: ["root-b", "task-1", "root-a"], done: [] });
  expect(updateTemplate).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "template-1",
      tasksKanbanState: JSON.stringify({ todo: ["root-b", "task-1", "root-a"], done: [] }),
    }),
  );
  expect(updateMilestone).not.toHaveBeenCalled();
});

test("creates a task with a server id and appends milestone ordering", async () => {
  createTask.mockResolvedValue({ task: apiTask({ id: "task-3", name: "Prepare agenda" }) });
  const session = graphSession(mappedGraph());

  await expect(
    session.run((editor) =>
      editor.onTaskCreate({
        name: "Prepare agenda",
        description: {},
        milestoneId: "milestone-1",
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: { ...taskStatus, icon: "circleDashed" },
        reminders: [],
        assignees: [],
      }),
    ),
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
    session.run((editor) => editor.onMilestoneUpdate("milestone-1", { title: "Launch", dueOffsetDays: 14 })),
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
    session.run((editor) => editor.onMilestoneCreate({ title: "Ship", description: {}, dueOffsetDays: 3 })),
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

  await expect(session.run((editor) => editor.onPersonCreate(person))).resolves.toBe(true);

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
  jest.mocked(Api.project_templates.updatePerson).mockRejectedValueOnce(new Error("Offline"));
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
  );

  await expect(
    session.run((editor) => editor.onPersonUpdate("template-person-1", { responsibility: "Updated" })),
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
    session.run((editor) =>
      editor.onStatusesChange({ nextStatuses: nextStatuses, deletedStatusReplacements: { todo: "done" } }),
    ),
  ).resolves.toBe(true);

  expect(session.current.statuses.map((status) => status.id)).toEqual(["done"]);
  expect(session.current.tasks.every((task) => task.status.id === "done")).toBe(true);
});

test("shows task edits while saving and restores the previous value on failure", async () => {
  let rejectSave = (_error: Error) => {};
  updateTask.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      }),
  );
  const session = graphSession(mappedGraph());

  let saving: Promise<boolean>;
  act(() => {
    saving = session.current.onTaskUpdate("task-1", { name: "Pending" });
  });
  expect(session.current.tasks[0]?.name).toBe("Pending");

  await act(async () => {
    rejectSave(new Error("Offline"));
    expect(await saving).toBe(false);
  });
  expect(session.current.tasks[0]?.name).toBe("First");
});

test("replaces and deletes contributors using the template person id", async () => {
  const session = graphSession(mappedGraph());
  const person = { id: "person-2", fullName: "Emily Davis", avatarUrl: null };

  await expect(
    session.run((editor) =>
      editor.onPersonUpdate("template-person-1", {
        person,
        role: "contributor",
        responsibility: "Launch",
        accessLevel: 70,
      }),
    ),
  ).resolves.toBe(true);

  expect(Api.project_templates.updatePerson).toHaveBeenCalledWith({
    templateId: "template-1",
    templatePersonId: "template-person-1",
    personId: "person-2",
    role: "contributor",
    responsibility: "Launch",
    accessLevel: 70,
  });

  await expect(session.run((editor) => editor.onPersonDelete("template-person-1"))).resolves.toBe(true);
  expect(Api.project_templates.deletePerson).toHaveBeenCalledWith({
    templateId: "template-1",
    templatePersonId: "template-person-1",
  });
});

test("does not create a contributor without a selected person", async () => {
  const session = graphSession(mappedGraph());

  await expect(
    session.run((editor) =>
      editor.onPersonCreate({
        person: null,
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
      }),
    ),
  ).resolves.toBe(false);

  expect(createPerson).not.toHaveBeenCalled();
});
