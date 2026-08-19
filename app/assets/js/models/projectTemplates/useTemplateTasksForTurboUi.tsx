import React from "react";
import type { ProjectTemplate } from "@/api";
import { applyTaskMove } from "@/models/tasks/listOrdering";
import { compareIds } from "@/routes/paths";
import { createTaskMove, createTaskOperations, mapTemplateTaskGraph, type Mutate } from "./operations";

type MappedGraph = ReturnType<typeof mapTemplateTaskGraph>;

export { mapTemplateTaskGraph };

export async function performTemplateTaskReorder({
  graph,
  templateId,
  mutate,
  taskId,
  milestoneId,
  index,
  commit,
}: {
  graph: MappedGraph;
  templateId: string;
  mutate: Mutate;
  taskId: string;
  milestoneId: string | null;
  index: number;
  commit: (next: MappedGraph) => void;
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

  commit({
    ...graph,
    tasks: graph.tasks.map((task) => {
      const next = moved.tasks.find((item) => compareIds(item.id, task.id));
      return next ? { ...task, milestoneId: next.milestoneId } : task;
    }),
    milestones: graph.milestones.map((milestone) => {
      const next = moved.milestones.find((item) => compareIds(item.id, milestone.id));
      return next ? { ...milestone, tasksOrderingState: next.tasksOrderingState } : milestone;
    }),
  });

  const saved = await createTaskMove({ templateId, mutate })(taskId, milestoneId, index);
  if (!saved) commit(graph);
  return saved;
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

  const taskOps = React.useMemo(() => createTaskOperations({ templateId: template.id, mutate }), [mutate, template.id]);

  const onTaskReorder = React.useCallback(
    (taskId: string, milestoneId: string | null, index: number) =>
      performTemplateTaskReorder({
        graph,
        templateId: template.id,
        mutate,
        taskId,
        milestoneId,
        index,
        commit: setGraph,
      }),
    [graph, mutate, template.id],
  );

  return {
    people: graph.people,
    tasks: graph.tasks,
    milestones: graph.milestones,
    tasksKanbanState: graph.tasksKanbanState,
    statuses: graph.statuses,
    onTaskCreate: taskOps.onTaskCreate,
    onTaskUpdate: taskOps.onTaskUpdate,
    onTaskDelete: taskOps.onTaskDelete,
    onTaskReorder,
  };
}
