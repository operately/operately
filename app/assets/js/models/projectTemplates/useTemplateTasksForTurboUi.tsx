import React from "react";
import Api, { type ProjectTemplate } from "@/api";
import { applyTaskMove } from "@/models/tasks/listOrdering";
import { compareIds } from "@/routes/paths";
import type { KanbanState, TemplateProjectPage } from "turboui";
import {
  createTaskMove,
  createTemplateMilestone,
  createTemplateTask,
  mapTemplateTaskGraph,
  persistMilestoneUpdate,
  persistPersonCreate,
  persistPersonDelete,
  persistPersonUpdate,
  persistStatusesChange,
  persistTaskUpdate,
  serializeJson,
  toTask,
  toTemplateMilestone,
  type Mutate,
} from "./operations";
import {
  applyCreatedMilestone,
  applyCreatedPerson,
  applyCreatedTask,
  applyKanbanContainerPatch,
  applyMilestoneDeleted,
  applyMilestonePatch,
  applyMilestoneReorder,
  applyPersonDeleted,
  applyPersonPatch,
  applyStatusesChange,
  applyTaskDeleted,
  applyTaskPatch,
  replaceMilestoneId,
  replacePersonId,
  replaceTaskId,
  type TemplateTaskGraph,
} from "./optimisticUpdates";

export { mapTemplateTaskGraph };

type GraphCommit = {
  graph: TemplateTaskGraph;
  commit: (next: TemplateTaskGraph) => void;
};

type PersistSession = GraphCommit & {
  templateId: string;
  mutate: Mutate;
};

type TaskKanbanChangeEvent = {
  milestoneId: string | null;
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: KanbanState;
};

export async function performTemplateTaskReorder({
  graph,
  templateId,
  mutate,
  taskId,
  milestoneId,
  index,
  commit,
}: PersistSession & {
  taskId: string;
  milestoneId: string | null;
  index: number;
}): Promise<boolean> {
  const moved = applyTaskMove(
    {
      tasks: graph.tasks.map((task) => ({ id: task.id, milestoneId: task.milestoneId })),
      milestones: graph.milestones.map((milestone) => ({
        id: milestone.id,
        tasksOrderingState: milestone.tasksOrderingState ?? [],
      })),
    },
    taskId,
    milestoneId,
    index,
  );

  return persistGraphChange(
    { graph, commit },
    {
      ...graph,
      tasks: graph.tasks.map((task) => {
        const next = moved.tasks.find((item) => compareIds(item.id, task.id));
        return next ? { ...task, milestoneId: next.milestoneId } : task;
      }),
      milestones: graph.milestones.map((milestone) => {
        const next = moved.milestones.find((item) => compareIds(item.id, milestone.id));
        return next ? { ...milestone, tasksOrderingState: next.tasksOrderingState } : milestone;
      }),
    },
    () => createTaskMove({ templateId, mutate })(taskId, milestoneId, index),
  );
}

export async function performTemplateTaskUpdate({
  graph,
  templateId,
  mutate,
  taskId,
  updates,
  commit,
}: PersistSession & { taskId: string; updates: Partial<TemplateProjectPage.Task> }): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyTaskPatch(graph, taskId, updates), () =>
    mutate("Task not updated", () => persistTaskUpdate(templateId, taskId, updates)),
  );
}

export async function performTemplateTaskKanbanChange({
  graph,
  templateId,
  mutate,
  event,
  commit,
}: PersistSession & { event: TaskKanbanChangeEvent }): Promise<boolean> {
  const task = graph.tasks.find((item) => compareIds(item.id, event.taskId));
  if (!task) return false;

  const status =
    graph.statuses.find((item) => item.value === event.to.status || item.id === event.to.status) ?? null;
  if (!status) return false;

  const containerMilestoneId = task.milestoneId;
  const statusKeys = graph.statuses.map((item) => item.value || item.id);
  const containerKanban = sliceKanbanForContainer(event.updatedKanbanState, graph.tasks, containerMilestoneId, statusKeys);
  const next = applyKanbanContainerPatch(graph, containerMilestoneId, containerKanban, event.taskId, status);

  return persistGraphChange({ graph, commit }, next, () =>
    mutate("Task not updated", async () => {
      await persistTaskUpdate(templateId, event.taskId, { status });

      if (containerMilestoneId) {
        await persistMilestoneUpdate(templateId, containerMilestoneId, { tasksKanbanState: containerKanban });
      } else {
        await Api.project_templates.update({
          id: templateId,
          tasksKanbanState: serializeJson(containerKanban),
        });
      }
    }),
  );
}

function sliceKanbanForContainer(
  state: KanbanState,
  tasks: TemplateProjectPage.Task[],
  containerMilestoneId: string | null,
  keys: string[],
): KanbanState {
  const containerTasks = tasks.filter((item) => compareIds(item.milestoneId, containerMilestoneId));

  return Object.fromEntries(
    keys.map((key) => [
      key,
      (state[key] ?? [])
        .map((rawId) => containerTasks.find((item) => compareIds(item.id, rawId))?.id)
        .filter((id): id is string => Boolean(id)),
    ]),
  );
}

export async function performTemplateTaskCreate({
  graph,
  templateId,
  mutate,
  task,
  commit,
}: PersistSession & { task: Omit<TemplateProjectPage.Task, "id"> }): Promise<boolean> {
  const tempId = `temp-${Date.now()}`;
  const optimistic = applyCreatedTask(graph, { ...task, id: tempId });
  commit(optimistic);

  const created: { task: Awaited<ReturnType<typeof createTemplateTask>>["task"] | null } = { task: null };
  const saved = await mutate("Task not created", async () => {
    created.task = (await createTemplateTask(templateId, task)).task;
  });

  const mapped = created.task ? toTask(created.task, task.assignees ?? []) : null;
  if (!saved || !mapped) {
    commit(graph);
    return false;
  }

  commit(replaceTaskId(optimistic, tempId, mapped));
  return true;
}

async function performTemplateTaskDelete({
  graph,
  templateId,
  mutate,
  taskId,
  commit,
}: PersistSession & { taskId: string }): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyTaskDeleted(graph, taskId), () =>
    mutate("Task not deleted", () => Api.project_templates.deleteTask({ templateId, taskId })),
  );
}

export async function performTemplateMilestoneUpdate({
  graph,
  templateId,
  mutate,
  milestoneId,
  updates,
  commit,
}: PersistSession & { milestoneId: string; updates: Partial<TemplateProjectPage.Milestone> }): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyMilestonePatch(graph, milestoneId, updates), () =>
    mutate("Milestone not updated", () => persistMilestoneUpdate(templateId, milestoneId, updates)),
  );
}

export async function performTemplateMilestoneCreate({
  graph,
  templateId,
  mutate,
  milestone,
  milestoneLink,
  commit,
}: PersistSession & {
  milestone: Omit<TemplateProjectPage.Milestone, "id" | "link" | "tasksOrderingState" | "tasksKanbanState">;
  milestoneLink: (milestoneId: string) => string;
}): Promise<boolean> {
  const tempId = `temp-${Date.now()}`;
  const optimistic = applyCreatedMilestone(graph, {
    ...milestone,
    id: tempId,
    link: milestoneLink(tempId),
    tasksOrderingState: [],
    tasksKanbanState: {},
  });
  commit(optimistic);

  const created: { milestone: Awaited<ReturnType<typeof createTemplateMilestone>>["milestone"] | null } = {
    milestone: null,
  };
  const saved = await mutate("Milestone not created", async () => {
    created.milestone = (await createTemplateMilestone(templateId, milestone)).milestone;
  });

  if (!saved || !created.milestone) {
    commit(graph);
    return false;
  }

  commit(
    replaceMilestoneId(optimistic, tempId, toTemplateMilestone(created.milestone, milestoneLink(created.milestone.id))),
  );
  return true;
}

async function performTemplateMilestoneDelete({
  graph,
  templateId,
  mutate,
  milestoneId,
  commit,
}: PersistSession & { milestoneId: string }): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyMilestoneDeleted(graph, milestoneId), () =>
    mutate("Milestone not deleted", () => Api.project_templates.deleteMilestone({ templateId, milestoneId })),
  );
}

async function performTemplateMilestoneReorder({
  graph,
  templateId,
  mutate,
  milestoneId,
  destinationIndex,
  commit,
}: PersistSession & { milestoneId: string; destinationIndex: number }): Promise<boolean> {
  const next = applyMilestoneReorder(graph, milestoneId, destinationIndex);
  return persistGraphChange({ graph, commit }, next, () =>
    mutate("Milestones not reordered", () =>
      Api.project_templates.update({
        id: templateId,
        milestonesOrderingState: next.milestonesOrderingState,
      }),
    ),
  );
}

export async function performTemplatePersonCreate({
  graph,
  templateId,
  mutate,
  person,
  commit,
}: PersistSession & { person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active"> }): Promise<boolean> {
  if (!person.person) return false;

  const tempId = `temp-${Date.now()}`;
  const optimisticPerson: TemplateProjectPage.TemplatePerson = { ...person, id: tempId, active: true };
  const optimistic = applyCreatedPerson(graph, optimisticPerson);
  commit(optimistic);

  const created: { id: string | null } = { id: null };
  const saved = await mutate("Contributor not added", async () => {
    created.id = (await persistPersonCreate(templateId, person)).person.id;
  });

  if (!saved || !created.id) {
    commit(graph);
    return false;
  }

  commit(replacePersonId(optimistic, tempId, { ...optimisticPerson, id: created.id }));
  return true;
}

export async function performTemplatePersonUpdate({
  graph,
  templateId,
  mutate,
  personId,
  updates,
  commit,
}: PersistSession & {
  personId: string;
  updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>;
}): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyPersonPatch(graph, personId, updates), () =>
    mutate("Contributor not updated", () => persistPersonUpdate(templateId, personId, updates)),
  );
}

async function performTemplatePersonDelete({
  graph,
  templateId,
  mutate,
  personId,
  commit,
}: PersistSession & { personId: string }): Promise<boolean> {
  return persistGraphChange({ graph, commit }, applyPersonDeleted(graph, personId), () =>
    mutate("Contributor not removed", () => persistPersonDelete(templateId, personId)),
  );
}

export async function performTemplateStatusesChange({
  graph,
  templateId,
  mutate,
  nextStatuses,
  deletedStatusReplacements,
  commit,
}: PersistSession & {
  nextStatuses: TemplateProjectPage.Props["statuses"];
  deletedStatusReplacements: Record<string, string>;
}): Promise<boolean> {
  return persistGraphChange(
    { graph, commit },
    applyStatusesChange(graph, nextStatuses, deletedStatusReplacements),
    () =>
      mutate("Workflow not updated", () => persistStatusesChange(templateId, nextStatuses, deletedStatusReplacements)),
  );
}

export function useTemplateTasksForTurboUi({
  template,
  profilePath,
  milestoneLink,
  mutate,
}: {
  template: ProjectTemplate;
  profilePath: (personId: string) => string;
  milestoneLink: (milestoneId: string) => string;
  mutate: Mutate;
}) {
  const [graph, setGraph] = React.useState(() => mapTemplateTaskGraph(template, profilePath, milestoneLink));

  React.useEffect(() => {
    setGraph(mapTemplateTaskGraph(template, profilePath, milestoneLink));
  }, [milestoneLink, profilePath, template]);

  const session = { graph, templateId: template.id, mutate, commit: setGraph };

  return {
    people: graph.people,
    tasks: graph.tasks,
    milestones: graph.milestones,
    milestonesOrderingState: graph.milestonesOrderingState,
    tasksKanbanState: graph.tasksKanbanState,
    statuses: graph.statuses,
    onTaskCreate: (task: Omit<TemplateProjectPage.Task, "id">) => {
      void performTemplateTaskCreate({ ...session, task });
    },
    onTaskUpdate: (taskId: string, updates: Partial<TemplateProjectPage.Task>) =>
      performTemplateTaskUpdate({ ...session, taskId, updates }),
    onTaskDelete: (taskId: string) => performTemplateTaskDelete({ ...session, taskId }),
    onTaskReorder: (taskId: string, milestoneId: string | null, index: number) =>
      performTemplateTaskReorder({ ...session, taskId, milestoneId, index }),
    onTaskKanbanChange: (event: TaskKanbanChangeEvent) => performTemplateTaskKanbanChange({ ...session, event }),
    onMilestoneCreate: (
      milestone: Omit<TemplateProjectPage.Milestone, "id" | "link" | "tasksOrderingState" | "tasksKanbanState">,
    ) => {
      void performTemplateMilestoneCreate({ ...session, milestone, milestoneLink });
    },
    onMilestoneUpdate: (milestoneId: string, updates: Partial<TemplateProjectPage.Milestone>) =>
      performTemplateMilestoneUpdate({ ...session, milestoneId, updates }),
    onMilestoneDelete: (milestoneId: string) => performTemplateMilestoneDelete({ ...session, milestoneId }),
    onMilestoneReorder: (milestoneId: string, destinationIndex: number) =>
      performTemplateMilestoneReorder({ ...session, milestoneId, destinationIndex }),
    onPersonCreate: (person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active">) =>
      performTemplatePersonCreate({ ...session, person }),
    onPersonUpdate: (personId: string, updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>) =>
      performTemplatePersonUpdate({ ...session, personId, updates }),
    onPersonDelete: (personId: string) => performTemplatePersonDelete({ ...session, personId }),
    onStatusesChange: ({
      nextStatuses,
      deletedStatusReplacements,
    }: {
      nextStatuses: TemplateProjectPage.Props["statuses"];
      deletedStatusReplacements: Record<string, string>;
    }) => performTemplateStatusesChange({ ...session, nextStatuses, deletedStatusReplacements }),
  };
}

async function persistGraphChange(
  { graph, commit }: GraphCommit,
  next: TemplateTaskGraph,
  persist: () => Promise<boolean>,
) {
  commit(next);
  const saved = await persist();
  if (!saved) commit(graph);
  return saved;
}
