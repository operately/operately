import Api, {
  type ProjectTemplate,
  type ProjectTemplateMilestone,
  type ProjectTemplateTask,
  type TaskReminder,
} from "@/api";
import * as Tasks from "@/models/tasks";
import { parseContent, TemplateProjectPage } from "turboui";

export type Mutate = (message: string, operation: () => Promise<unknown>) => Promise<boolean>;

export function activePersonIds(assignees: TemplateProjectPage.TemplatePerson[] | undefined) {
  return (assignees ?? []).flatMap((assignee) => (assignee.active && assignee.person ? [assignee.person.id] : []));
}

function mapTemplatePeople(
  template: Pick<ProjectTemplate, "people" | "taskAssignments">,
  profilePath: (personId: string) => string,
) {
  const people = (template.people ?? []).map((templatePerson) => ({
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

function toTemplateMilestone(milestone: ProjectTemplateMilestone, link: string): TemplateProjectPage.Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    description: content(milestone.description),
    dueOffsetDays: milestone.dueOffsetDays ?? null,
    tasksOrderingState: milestone.tasksOrderingState,
    tasksKanbanState: parseJson(milestone.tasksKanbanState),
    link,
  };
}

export function mapTemplateTaskGraph(
  template: Pick<
    ProjectTemplate,
    "people" | "taskAssignments" | "tasks" | "milestones" | "tasksKanbanState" | "taskStatuses"
  >,
  profilePath: (personId: string) => string,
  milestoneLink: (milestoneId: string) => string,
) {
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
    tasksKanbanState: parseJson(template.tasksKanbanState),
    statuses: Tasks.parseTaskStatusesForTurboUi(template.taskStatuses),
  };
}

function toTask(
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

export function createTaskOperations({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  function onTaskCreate(task: Omit<TemplateProjectPage.Task, "id">) {
    void mutate("Task not created", () => Api.project_templates.createTask(taskInput(templateId, task)));
  }

  function onTaskUpdate(taskId: string, updates: Partial<TemplateProjectPage.Task>) {
    return mutate("Task not updated", async () => {
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
    });
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

function parseJson(value?: string | null): unknown {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
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
