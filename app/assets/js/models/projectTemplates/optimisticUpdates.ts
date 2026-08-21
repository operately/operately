import { compareIds } from "@/routes/paths";
import type { TemplateProjectPage } from "turboui";
import type { TemplateTaskGraph } from "./operations";

export type { TemplateTaskGraph };

/**
 * Returns a copy of the template task graph with one task's fields updated.
 * Used for optimistic UI before persist: name, status, assignees, due offset, and similar patches.
 * When `milestoneId` changes, the task is also moved to the end of that milestone's ordering list
 * (or dropped from ordering if the destination is the template root).
 */
export function applyTaskPatch(
  graph: TemplateTaskGraph,
  taskId: string,
  updates: Partial<TemplateProjectPage.Task>,
): TemplateTaskGraph {
  const current = graph.tasks.find((task) => compareIds(task.id, taskId));
  if (!current) return graph;

  const nextTask = { ...current, ...updates };
  const tasks = graph.tasks.map((task) => (compareIds(task.id, taskId) ? nextTask : task));

  // Field-only edits keep existing milestone membership and ordering.
  if (updates.milestoneId === undefined || compareIds(current.milestoneId, nextTask.milestoneId)) {
    return { ...graph, tasks };
  }

  return {
    ...graph,
    tasks,
    milestones: moveTaskOrdering(graph.milestones, taskId, nextTask.milestoneId),
  };
}

export function applyCreatedTask(graph: TemplateTaskGraph, task: TemplateProjectPage.Task): TemplateTaskGraph {
  return {
    ...graph,
    tasks: [...graph.tasks, task],
    milestones: appendTaskOrdering(graph.milestones, task.id, task.milestoneId),
  };
}

export function replaceTaskId(
  graph: TemplateTaskGraph,
  previousId: string,
  task: TemplateProjectPage.Task,
): TemplateTaskGraph {
  return {
    ...graph,
    tasks: graph.tasks.map((item) => (compareIds(item.id, previousId) ? task : item)),
    milestones: graph.milestones.map((milestone) => ({
      ...milestone,
      tasksOrderingState: renameOrderingId(milestone.tasksOrderingState, previousId, task.id),
    })),
  };
}

export function applyTaskDeleted(graph: TemplateTaskGraph, taskId: string): TemplateTaskGraph {
  return {
    ...graph,
    tasks: graph.tasks.filter((task) => !compareIds(task.id, taskId)),
    milestones: graph.milestones.map((milestone) => ({
      ...milestone,
      tasksOrderingState: (milestone.tasksOrderingState ?? []).filter((id) => !compareIds(id, taskId)),
    })),
  };
}

export function applyMilestonePatch(
  graph: TemplateTaskGraph,
  milestoneId: string,
  updates: Partial<TemplateProjectPage.Milestone>,
): TemplateTaskGraph {
  return {
    ...graph,
    milestones: graph.milestones.map((milestone) =>
      compareIds(milestone.id, milestoneId) ? { ...milestone, ...updates } : milestone,
    ),
  };
}

export function applyCreatedMilestone(
  graph: TemplateTaskGraph,
  milestone: TemplateProjectPage.Milestone,
): TemplateTaskGraph {
  return {
    ...graph,
    milestones: [...graph.milestones, milestone],
    milestonesOrderingState: [...graph.milestonesOrderingState, milestone.id],
  };
}

export function replaceMilestoneId(
  graph: TemplateTaskGraph,
  previousId: string,
  milestone: TemplateProjectPage.Milestone,
): TemplateTaskGraph {
  return {
    ...graph,
    milestones: graph.milestones.map((item) => (compareIds(item.id, previousId) ? milestone : item)),
    milestonesOrderingState: renameOrderingId(graph.milestonesOrderingState, previousId, milestone.id),
  };
}

export function applyMilestoneDeleted(graph: TemplateTaskGraph, milestoneId: string): TemplateTaskGraph {
  return {
    ...graph,
    milestones: graph.milestones.filter((milestone) => !compareIds(milestone.id, milestoneId)),
    milestonesOrderingState: graph.milestonesOrderingState.filter((id) => !compareIds(id, milestoneId)),
    tasks: graph.tasks.filter((task) => !compareIds(task.milestoneId, milestoneId)),
  };
}

export function applyMilestoneReorder(
  graph: TemplateTaskGraph,
  milestoneId: string,
  destinationIndex: number,
): TemplateTaskGraph {
  return {
    ...graph,
    milestonesOrderingState: moveId(graph.milestonesOrderingState, milestoneId, destinationIndex),
  };
}

/**
 * Updates a task's status and the template-root board kanban (all tasks), matching projects.
 */
export function applyKanbanBoardPatch(
  graph: TemplateTaskGraph,
  tasksKanbanState: TemplateProjectPage.Props["template"]["tasksKanbanState"],
  taskId: string,
  status: TemplateProjectPage.Task["status"],
): TemplateTaskGraph {
  return {
    ...applyTaskPatch(graph, taskId, { status }),
    tasksKanbanState,
  };
}

/** @deprecated Use applyKanbanBoardPatch — board kanban is always on the template root. */
export function applyKanbanContainerPatch(
  graph: TemplateTaskGraph,
  _containerMilestoneId: string | null,
  tasksKanbanState: TemplateProjectPage.Milestone["tasksKanbanState"],
  taskId: string,
  status: TemplateProjectPage.Task["status"],
): TemplateTaskGraph {
  return applyKanbanBoardPatch(graph, tasksKanbanState, taskId, status);
}

function moveId(ids: string[], id: string, destinationIndex: number) {
  const next = ids.filter((item) => item !== id);
  next.splice(Math.max(0, Math.min(destinationIndex, next.length)), 0, id);
  return next;
}

function moveTaskOrdering(
  milestones: TemplateProjectPage.Milestone[],
  taskId: string,
  destinationMilestoneId: string | null,
) {
  return milestones.map((milestone) => {
    const withoutTask = (milestone.tasksOrderingState ?? []).filter((id) => !compareIds(id, taskId));
    if (!compareIds(milestone.id, destinationMilestoneId)) {
      return { ...milestone, tasksOrderingState: withoutTask };
    }

    return { ...milestone, tasksOrderingState: [...withoutTask, taskId] };
  });
}

function appendTaskOrdering(milestones: TemplateProjectPage.Milestone[], taskId: string, milestoneId: string | null) {
  if (!milestoneId) return milestones;

  return milestones.map((milestone) =>
    compareIds(milestone.id, milestoneId)
      ? { ...milestone, tasksOrderingState: [...(milestone.tasksOrderingState ?? []), taskId] }
      : milestone,
  );
}

function renameOrderingId(ids: string[] | undefined, previousId: string, nextId: string) {
  return (ids ?? []).map((id) => (compareIds(id, previousId) ? nextId : id));
}

export function applyCreatedPerson(
  graph: TemplateTaskGraph,
  person: TemplateProjectPage.TemplatePerson,
): TemplateTaskGraph {
  return { ...graph, people: [...graph.people, person] };
}

export function replacePersonId(
  graph: TemplateTaskGraph,
  previousId: string,
  person: TemplateProjectPage.TemplatePerson,
): TemplateTaskGraph {
  return {
    ...graph,
    people: graph.people.map((item) => (compareIds(item.id, previousId) ? person : item)),
    tasks: graph.tasks.map((task) => ({
      ...task,
      assignees: (task.assignees ?? []).map((assignee) => (compareIds(assignee.id, previousId) ? person : assignee)),
    })),
  };
}

export function applyPersonPatch(
  graph: TemplateTaskGraph,
  personId: string,
  updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>,
): TemplateTaskGraph {
  const current = graph.people.find((person) => compareIds(person.id, personId));
  if (!current) return graph;

  const nextPerson = { ...current, ...updates };
  return {
    ...graph,
    people: graph.people.map((person) => (compareIds(person.id, personId) ? nextPerson : person)),
    tasks: graph.tasks.map((task) => ({
      ...task,
      assignees: (task.assignees ?? []).map((assignee) => (compareIds(assignee.id, personId) ? nextPerson : assignee)),
    })),
  };
}

export function applyPersonDeleted(graph: TemplateTaskGraph, personId: string): TemplateTaskGraph {
  return {
    ...graph,
    people: graph.people.filter((person) => !compareIds(person.id, personId)),
    tasks: graph.tasks.map((task) => ({
      ...task,
      assignees: (task.assignees ?? []).filter((assignee) => !compareIds(assignee.id, personId)),
    })),
  };
}

export function applyStatusesChange(
  graph: TemplateTaskGraph,
  nextStatuses: TemplateProjectPage.Props["statuses"],
  deletedStatusReplacements: Record<string, string>,
): TemplateTaskGraph {
  const statusesById = new Map(nextStatuses.map((status) => [status.id, status]));
  return {
    ...graph,
    statuses: nextStatuses,
    tasks: graph.tasks.map((task) => {
      const replacementId = deletedStatusReplacements[task.status.id];
      if (!replacementId) return task;
      const nextStatus = statusesById.get(replacementId);
      return nextStatus ? { ...task, status: nextStatus } : task;
    }),
  };
}
