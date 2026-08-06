import Api, { type ProjectTemplateTask, type TaskReminder } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as Tasks from "@/models/tasks";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { parseContent, showErrorToast, TemplateProjectPage } from "turboui";
import React from "react";
import { loader, type LoadedData } from "./loader";

export default { name: "ProjectTemplatePage", loader, Page } as PageModule;

type Mutate = (message: string, operation: () => Promise<unknown>) => Promise<boolean>;

function Page() {
  const { template } = Pages.useLoadedData<LoadedData>();
  const refresh = Pages.useRefresh();
  const paths = usePaths();
  const statuses = Tasks.parseTaskStatusesForTurboUi(template.taskStatuses);
  const permissions = template.permissions ?? {
    canView: true,
    canComment: false,
    canEdit: false,
    hasFullAccess: false,
  };

  const mutate: Mutate = async (message, operation) => {
    try {
      await operation();
      await refresh();
      return true;
    } catch (_error) {
      showErrorToast(message, "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  };

  const tasks = (template.tasks ?? []).map(toTask).filter((task): task is TemplateProjectPage.Task => task !== null);
  const milestones = (template.milestones ?? []).map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    description: content(milestone.description),
    dueOffsetDays: milestone.dueOffsetDays ?? null,
    tasksOrderingState: milestone.tasksOrderingState,
    tasksKanbanState: parseJson(milestone.tasksKanbanState),
  }));

  async function onTemplateUpdate(updates: Partial<TemplateProjectPage.Props["template"]>) {
    return mutate("Template not updated", () =>
      Api.project_templates.update({
        id: template.id,
        name: updates.name,
        description: serializeContent(updates.description),
        durationDays: updates.durationDays,
        milestonesOrderingState: updates.milestonesOrderingState,
        tasksKanbanState: serializeJson(updates.tasksKanbanState),
      }),
    );
  }

  function onStatusesChange({
    nextStatuses,
    deletedStatusReplacements,
  }: {
    nextStatuses: TemplateProjectPage.Props["statuses"];
    deletedStatusReplacements: Record<string, string>;
  }) {
    return mutate("Workflow not updated", () =>
      Api.project_templates.update({
        id: template.id,
        taskStatuses: Tasks.serializeTaskStatuses(nextStatuses),
        deletedStatusReplacements: Object.entries(deletedStatusReplacements).map(
          ([deletedStatusId, replacementStatusId]) => ({ deletedStatusId, replacementStatusId }),
        ),
      }),
    );
  }

  const { onMilestoneCreate, onMilestoneUpdate, onMilestoneDelete, onMilestoneReorder } = useMilestoneOperations({
    templateId: template.id,
    milestonesOrderingState: template.milestonesOrderingState ?? milestones.map((item) => item.id),
    mutate,
  });

  const { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder } = useTaskOperations({
    templateId: template.id,
    tasks,
    statuses,
    mutate,
  });

  return (
    <TemplateProjectPage
      template={{
        id: template.id,
        name: template.name,
        description: content(template.description),
        durationDays: template.durationDays ?? null,
        milestonesOrderingState: template.milestonesOrderingState ?? [],
        tasksKanbanState: parseJson(template.tasksKanbanState),
      }}
      space={{ id: template.space.id, name: template.space.name, link: paths.spacePath(template.space.id) }}
      projectTemplatesLink={paths.spaceProjectTemplatesPath(template.space.id)}
      permissions={permissions}
      statuses={statuses}
      milestones={milestones}
      tasks={tasks}
      richTextHandlers={useRichEditorHandlers()}
      onTemplateUpdate={onTemplateUpdate}
      onStatusesChange={onStatusesChange}
      onMilestoneCreate={onMilestoneCreate}
      onMilestoneUpdate={onMilestoneUpdate}
      onMilestoneDelete={onMilestoneDelete}
      onMilestoneReorder={onMilestoneReorder}
      onTaskCreate={onTaskCreate}
      onTaskUpdate={onTaskUpdate}
      onTaskDelete={onTaskDelete}
      onTaskReorder={onTaskReorder}
    />
  );
}

function useMilestoneOperations({
  templateId,
  milestonesOrderingState,
  mutate,
}: {
  templateId: string;
  milestonesOrderingState: string[];
  mutate: Mutate;
}) {
  function onMilestoneCreate(
    milestone: Omit<TemplateProjectPage.Milestone, "id" | "tasksOrderingState" | "tasksKanbanState">,
  ) {
    void mutate("Milestone not created", () =>
      Api.project_templates.createMilestone({
        templateId,
        title: milestone.title,
        description: serializeContent(milestone.description),
        dueOffsetDays: milestone.dueOffsetDays,
      }),
    );
  }

  function onMilestoneUpdate(milestoneId: string, updates: Partial<TemplateProjectPage.Milestone>) {
    return mutate("Milestone not updated", () =>
      Api.project_templates.updateMilestone({
        templateId,
        milestoneId,
        title: updates.title,
        description: serializeContent(updates.description),
        dueOffsetDays: updates.dueOffsetDays,
        tasksOrderingState: updates.tasksOrderingState,
        tasksKanbanState: serializeJson(updates.tasksKanbanState),
      }),
    ).then(() => undefined);
  }

  function onMilestoneDelete(milestoneId: string) {
    return mutate("Milestone not deleted", () =>
      Api.project_templates.deleteMilestone({ templateId, milestoneId }),
    ).then(() => undefined);
  }

  function onMilestoneReorder(milestoneId: string, destinationIndex: number) {
    return mutate("Milestones not reordered", () =>
      Api.project_templates.update({
        id: templateId,
        milestonesOrderingState: reorder(milestonesOrderingState, milestoneId, destinationIndex),
      }),
    ).then(() => undefined);
  }

  return { onMilestoneCreate, onMilestoneUpdate, onMilestoneDelete, onMilestoneReorder };
}

function useTaskOperations({
  templateId,
  tasks,
  statuses,
  mutate,
}: {
  templateId: string;
  tasks: TemplateProjectPage.Task[];
  statuses: TemplateProjectPage.Props["statuses"];
  mutate: Mutate;
}) {
  function onTaskCreate(task: Omit<TemplateProjectPage.Task, "id">) {
    void mutate("Task not created", () => Api.project_templates.createTask(taskInput(templateId, task)));
  }

  function onTaskUpdate(taskId: string, updates: Partial<TemplateProjectPage.Task>) {
    return mutate("Task not updated", () =>
      Api.project_templates.updateTask({ templateId, taskId, ...taskUpdates(updates) }),
    ).then(() => undefined);
  }

  function onTaskDelete(taskId: string) {
    return mutate("Task not deleted", () => Api.project_templates.deleteTask({ templateId, taskId })).then(
      () => undefined,
    );
  }

  function onTaskReorder(taskId: string, milestoneId: string | null, destinationIndex: number) {
    const ids = tasks.filter((task) => task.milestoneId === milestoneId).map((task) => task.id);
    const ordered = reorder(ids, taskId, destinationIndex);
    if (milestoneId)
      return mutate("Tasks not reordered", () =>
        Api.project_templates.updateMilestone({
          templateId,
          milestoneId,
          tasksOrderingState: ordered,
        }),
      ).then(() => undefined);
    return mutate("Tasks not reordered", () =>
      Api.project_templates.update({
        id: templateId,
        tasksKanbanState: serializeJson(rootKanban(ordered, tasks, statuses)),
      }),
    ).then(() => undefined);
  }

  return { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder };
}

function content(value?: string | null) {
  try {
    return parseContent(value || "{}");
  } catch {
    return null;
  }
}

function serializeContent(value: unknown) {
  return value === undefined ? undefined : value === null ? null : JSON.stringify(value);
}

function serializeJson(value: unknown) {
  return value === undefined ? undefined : JSON.stringify(value);
}

function parseJson(value?: string | null): unknown {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function toTask(task: ProjectTemplateTask): TemplateProjectPage.Task | null {
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
  };
}

function taskInput(templateId: string, task: Omit<TemplateProjectPage.Task, "id">) {
  return {
    templateId,
    milestoneId: task.milestoneId,
    name: task.name,
    description: serializeContent(task.description),
    priority: task.priority,
    size: task.size,
    dueOffsetDays: task.dueOffsetDays,
    reminders: task.reminders.map(toApiReminder),
    taskStatus: serializeTaskStatus(task.status),
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

function reorder(ids: string[], id: string, destination: number) {
  const next = ids.filter((item) => item !== id);
  next.splice(Math.max(0, Math.min(destination, next.length)), 0, id);
  return next;
}

function rootKanban(ids: string[], tasks: TemplateProjectPage.Task[], statuses: TemplateProjectPage.Props["statuses"]) {
  const taskStatuses = new Map(tasks.map((task) => [task.id, task.status.value || task.status.id]));
  return Object.fromEntries(
    statuses.map((status) => {
      const key = status.value || status.id;
      return [key, ids.filter((id) => taskStatuses.get(id) === key)];
    }),
  );
}
