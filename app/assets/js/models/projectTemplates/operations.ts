import Api, {
  type AccessOptionsInt,
  type ProjectTemplate,
  type ProjectTemplateMilestone,
  type ProjectTemplateTask,
  type TaskReminder,
} from "@/api";
import * as Tasks from "@/models/tasks";
import { parseContent, showErrorToast, TemplateProjectPage, type KanbanState } from "turboui";

export type Mutate = (message: string, operation: () => Promise<unknown>) => Promise<boolean>;

const ROLLBACK_HINT = "Your last confirmed template is still displayed. Try again.";

export const persistTemplateChange: Mutate = async (message, operation) => {
  try {
    await operation();
    return true;
  } catch {
    showErrorToast(message, ROLLBACK_HINT);
    return false;
  }
};

export async function persistAndRefreshTemplate(
  refresh: () => Promise<unknown>,
  message: string,
  operation: () => Promise<unknown>,
): Promise<boolean> {
  const saved = await persistTemplateChange(message, operation);
  if (saved) await refresh();
  return saved;
}

export function activePersonIds(assignees: TemplateProjectPage.TemplatePerson[] | undefined) {
  return (assignees ?? []).flatMap((assignee) => (assignee.active && assignee.person ? [assignee.person.id] : []));
}

function mapTemplatePeople(
  template: Pick<ProjectTemplate, "people" | "taskAssignments">,
  profilePath: (personId: string) => string,
) {
  const people: TemplateProjectPage.TemplatePerson[] = (template.people ?? []).map((templatePerson) => ({
    id: templatePerson.id,
    person: templatePerson.person
      ? {
          id: templatePerson.person.id,
          fullName: templatePerson.person.fullName,
          avatarUrl: templatePerson.person.avatarUrl ?? null,
          title: templatePerson.person.title ?? undefined,
          profileLink: profilePath(templatePerson.person.id),
        }
      : null,
    role: templatePerson.role,
    responsibility: templatePerson.responsibility ?? null,
    accessLevel: templatePerson.accessLevel,
    active: templatePerson.active,
  }));
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const assigneesByTaskId = new Map<string, TemplateProjectPage.TemplatePerson[]>();

  for (const assignment of template.taskAssignments ?? []) {
    const person = peopleById.get(assignment.projectTemplatePersonId);
    if (!person) continue;

    const taskAssignees = assigneesByTaskId.get(assignment.projectTemplateTaskId) ?? [];
    assigneesByTaskId.set(assignment.projectTemplateTaskId, [...taskAssignees, person]);
  }

  return { people, assigneesByTaskId };
}

export function toTemplateMilestone(milestone: ProjectTemplateMilestone, link: string): TemplateProjectPage.Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    description: content(milestone.description),
    dueOffsetDays: milestone.dueOffsetDays ?? null,
    tasksOrderingState: milestone.tasksOrderingState,
    tasksKanbanState: parseKanbanJson(milestone.tasksKanbanState),
    link,
  };
}

export type TemplateTaskGraph = {
  people: TemplateProjectPage.TemplatePerson[];
  tasks: TemplateProjectPage.Task[];
  milestones: TemplateProjectPage.Milestone[];
  milestonesOrderingState: string[];
  tasksKanbanState: KanbanState;
  statuses: TemplateProjectPage.Props["statuses"];
};

export function mapTemplateTaskGraph(
  template: Pick<
    ProjectTemplate,
    | "people"
    | "taskAssignments"
    | "tasks"
    | "milestones"
    | "milestonesOrderingState"
    | "tasksKanbanState"
    | "taskStatuses"
  >,
  profilePath: (personId: string) => string,
  milestoneLink: (milestoneId: string) => string,
): TemplateTaskGraph {
  const { people, assigneesByTaskId } = mapTemplatePeople(template, profilePath);
  const tasks = (template.tasks ?? [])
    .map((task) => toTask(task, assigneesByTaskId.get(task.id) ?? []))
    .filter((task): task is TemplateProjectPage.Task => task !== null);
  const milestones = (template.milestones ?? []).map((milestone) =>
    toTemplateMilestone(milestone, milestoneLink(milestone.id)),
  );

  return {
    people,
    tasks,
    milestones,
    milestonesOrderingState: template.milestonesOrderingState ?? milestones.map((milestone) => milestone.id),
    tasksKanbanState: parseKanbanJson(template.tasksKanbanState),
    statuses: Tasks.parseTaskStatusesForTurboUi(template.taskStatuses),
  };
}

export function toTask(
  task: ProjectTemplateTask,
  assignees: TemplateProjectPage.TemplatePerson[],
): TemplateProjectPage.Task | null {
  const status = Tasks.parseTaskStatusForTurboUi(task.taskStatus);
  if (!status) return null;
  return {
    id: task.id,
    name: task.name,
    description: content(task.description),
    milestoneId: task.projectTemplateMilestoneId ?? null,
    priority: task.priority ?? null,
    size: task.size ?? null,
    dueOffsetDays: task.dueOffsetDays ?? null,
    reminders: task.reminders.flatMap(toReminder),
    status,
    assignees,
  };
}

export function createTemplateTask(templateId: string, task: Omit<TemplateProjectPage.Task, "id">) {
  return Api.project_templates.createTask(taskInput(templateId, task));
}

export function createTemplateMilestone(
  templateId: string,
  milestone: Omit<TemplateProjectPage.Milestone, "id" | "link" | "tasksOrderingState" | "tasksKanbanState">,
) {
  return Api.project_templates.createMilestone({
    templateId,
    title: milestone.title,
    description: serializeContent(milestone.description),
    dueOffsetDays: milestone.dueOffsetDays,
  });
}

export function persistMilestoneUpdate(
  templateId: string,
  milestoneId: string,
  updates: Partial<TemplateProjectPage.Milestone>,
) {
  return Api.project_templates.updateMilestone({
    templateId,
    milestoneId,
    title: updates.title,
    description: serializeContent(updates.description),
    dueOffsetDays: updates.dueOffsetDays,
    tasksOrderingState: updates.tasksOrderingState,
    tasksKanbanState: serializeJson(updates.tasksKanbanState),
  });
}

export async function persistTaskUpdate(
  templateId: string,
  taskId: string,
  updates: Partial<TemplateProjectPage.Task>,
) {
  const { assignees, ...taskFields } = updates;

  if (Object.keys(taskFields).length > 0) {
    await Api.project_templates.updateTask({ templateId, taskId, ...taskUpdates(taskFields) });
  }

  if (assignees) {
    await Api.project_templates.updateTaskAssignees({
      templateId,
      taskId,
      assigneeIds: activePersonIds(assignees),
    });
  }
}

export function persistPersonCreate(
  templateId: string,
  person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active">,
) {
  const selectedPerson = person.person;
  if (!selectedPerson) throw new Error("A template contributor must have a person");

  return Api.project_templates.createPerson({
    templateId,
    personId: selectedPerson.id,
    role: person.role,
    responsibility: person.responsibility,
    accessLevel: person.accessLevel as AccessOptionsInt,
  });
}

export function persistPersonUpdate(
  templateId: string,
  templatePersonId: string,
  updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>,
) {
  return Api.project_templates.updatePerson({
    templateId,
    templatePersonId,
    personId: updates.person?.id,
    role: updates.role,
    responsibility: updates.responsibility,
    accessLevel: updates.accessLevel as AccessOptionsInt | undefined,
  });
}

export function persistPersonDelete(templateId: string, templatePersonId: string) {
  return Api.project_templates.deletePerson({ templateId, templatePersonId });
}

export function persistStatusesChange(
  templateId: string,
  nextStatuses: TemplateProjectPage.Props["statuses"],
  deletedStatusReplacements: Record<string, string>,
) {
  return Api.project_templates.update({
    id: templateId,
    taskStatuses: Tasks.serializeTaskStatuses(nextStatuses),
    deletedStatusReplacements: Object.entries(deletedStatusReplacements).map(
      ([deletedStatusId, replacementStatusId]) => ({ deletedStatusId, replacementStatusId }),
    ),
  });
}

export function createTaskOperations({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  function onTaskCreate(task: Omit<TemplateProjectPage.Task, "id">) {
    void mutate("Task not created", () => createTemplateTask(templateId, task));
  }

  function onTaskUpdate(taskId: string, updates: Partial<TemplateProjectPage.Task>) {
    return mutate("Task not updated", () => persistTaskUpdate(templateId, taskId, updates));
  }

  function onTaskDelete(taskId: string) {
    return mutate("Task not deleted", () => Api.project_templates.deleteTask({ templateId, taskId })).then(
      () => undefined,
    );
  }

  const onTaskReorder = createTaskMove({ templateId, mutate });

  return { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder };
}

export function createTaskMove({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (taskId: string, milestoneId: string | null, destinationIndex: number) =>
    mutate("Tasks not reordered", () =>
      Api.project_templates.updateMilestoneAndOrdering({
        templateId,
        taskId,
        milestoneId,
        index: destinationIndex,
      }),
    );
}

export function content(value?: string | null) {
  try {
    return parseContent(value || "{}");
  } catch {
    return null;
  }
}

export function serializeContent(value: unknown) {
  return value === undefined ? undefined : value === null ? null : JSON.stringify(value);
}

export function serializeJson(value: unknown) {
  return value === undefined ? undefined : JSON.stringify(value);
}

function parseJson(value?: string | null | object): unknown {
  if (value && typeof value === "object") return value;

  try {
    return JSON.parse((value as string) || "{}");
  } catch {
    return {};
  }
}

function parseKanbanJson(value?: string | null | object): KanbanState {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as KanbanState;
}

function taskInput(templateId: string, task: Omit<TemplateProjectPage.Task, "id">) {
  return {
    templateId,
    milestoneId: task.milestoneId,
    name: task.name,
    description: serializeContent(task.description ?? {}),
    priority: task.priority,
    size: task.size,
    dueOffsetDays: task.dueOffsetDays,
    reminders: task.reminders.map(toApiReminder),
    taskStatus: serializeTaskStatus(task.status),
    assigneeIds: activePersonIds(task.assignees),
  };
}

function taskUpdates(updates: Partial<TemplateProjectPage.Task>) {
  return {
    milestoneId: updates.milestoneId,
    name: updates.name,
    description: serializeContent(updates.description) as string | undefined,
    priority: updates.priority,
    size: updates.size,
    dueOffsetDays: updates.dueOffsetDays,
    reminders: updates.reminders?.map(toApiReminder),
    taskStatus: updates.status ? serializeTaskStatus(updates.status) : undefined,
  };
}

function toReminder(reminder: TaskReminder): TemplateProjectPage.Reminder[] {
  return reminder.type === "on_date" ? [] : [{ type: reminder.type, days: reminder.days ?? null }];
}

function toApiReminder(reminder: TemplateProjectPage.Reminder): TaskReminder {
  return { __typename: "task_reminder", type: reminder.type, days: reminder.days ?? null };
}

function serializeTaskStatus(status: TemplateProjectPage.Task["status"]) {
  const serialized = Tasks.serializeTaskStatus(status);
  if (!serialized) throw new Error("A template task must have a workflow status");
  return serialized;
}
