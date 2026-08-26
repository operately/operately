import { isContentEmpty } from "../RichContent";
import type { TaskBoard } from "../TaskBoard";
import type { NewTaskPayload } from "../TaskBoard/types";
import type { KanbanState } from "../TaskBoard/KanbanView/types";
import { compareIds } from "../utils/ids";
import type { TemplateProjectPage } from ".";

export function toBoardMilestone(milestone: TemplateProjectPage.Milestone): TaskBoard.Milestone {
  return {
    id: milestone.id,
    name: milestone.title,
    status: "pending",
    link: milestone.link,
    hasDescription: !isContentEmpty(milestone.description),
    tasksOrderingState: milestone.tasksOrderingState,
  };
}

export function toBoardTask(
  task: TemplateProjectPage.Task,
  milestones: TemplateProjectPage.Milestone[],
): TaskBoard.Task {
  const milestone = milestones.find((item) => compareIds(item.id, task.milestoneId)) ?? null;

  return {
    id: task.id,
    title: task.name,
    status: task.status,
    description: null,
    link: "#",
    assignees: (task.assignees ?? []).flatMap((assignee) =>
      assignee.active && assignee.person ? [assignee.person] : [],
    ),
    milestone: milestone ? toBoardMilestone(milestone) : null,
    dueDate: null,
    dueOffsetDays: task.dueOffsetDays,
    hasDescription: !isContentEmpty(task.description),
    type: "project",
  };
}

export function toTemplateTaskCreatePayload(
  payload: NewTaskPayload,
  fallbackMilestoneId: string | null,
  defaultStatus: TemplateProjectPage.Task["status"],
): Omit<TemplateProjectPage.Task, "id"> {
  return {
    name: payload.title,
    description: payload.description ?? null,
    milestoneId: payload.milestone?.id ?? fallbackMilestoneId,
    priority: null,
    size: null,
    dueOffsetDays: null,
    status: payload.status ?? defaultStatus,
    reminders: [],
    assignees: payload.assignees.map((person) => ({
      id: person.id,
      person,
      role: "contributor" as const,
      responsibility: null,
      accessLevel: 70,
      active: true,
    })),
  };
}

export function statusKeys(statuses: TemplateProjectPage.Props["statuses"]): string[] {
  return statuses.map((status) => status.value || status.id);
}

export function fillKanbanFromTasks(
  state: KanbanState,
  tasks: TemplateProjectPage.Task[],
  keys: string[],
): KanbanState {
  const listed = new Set<string>();
  const filled: KanbanState = {};

  keys.forEach((key) => {
    const orderedIds = (state[key] ?? [])
      .map((rawId) => tasks.find((task) => compareIds(task.id, rawId)))
      .filter((task): task is TemplateProjectPage.Task => Boolean(task))
      .filter((task) => taskStatusKey(task) === key)
      .map((task) => {
        listed.add(task.id);
        return task.id;
      });

    filled[key] = orderedIds;
  });

  tasks.forEach((task) => {
    if (listed.has(task.id)) return;
    const key = taskStatusKey(task);
    if (!keys.includes(key)) return;
    filled[key] = [...(filled[key] ?? []), task.id];
  });

  keys.forEach((key) => {
    if (!filled[key]) filled[key] = [];
  });

  return filled;
}

function taskStatusKey(task: TemplateProjectPage.Task): string {
  return task.status.value || task.status.id;
}
