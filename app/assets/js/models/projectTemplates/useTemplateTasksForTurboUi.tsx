import React from "react";
import { type AccessOptionsInt, type ProjectTemplate } from "@/api";
import * as Tasks from "@/models/tasks";
import { applyTaskMove } from "@/models/tasks/listOrdering";
import { useKanbanState } from "@/models/tasks/useKanbanState";
import { compareIds } from "@/routes/paths";
import { showErrorToast, type KanbanState, type TemplateProjectPage } from "turboui";
import * as Templates from "./projectTemplateEditorLifecycle";
import {
  activePersonIds,
  mapTemplateTaskGraph,
  serializeContent,
  serializeJson,
  taskInput,
  taskUpdates,
  toTask,
  toTemplateMilestone,
} from "./operations";
import {
  applyCreatedMilestone,
  applyCreatedPerson,
  applyCreatedTask,
  applyKanbanBoardPatch,
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

type TaskKanbanChangeEvent = {
  milestoneId: string | null;
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: KanbanState;
};

export function useTemplateTasksForTurboUi({
  template,
  profilePath,
  milestoneLink,
}: {
  template: ProjectTemplate;
  profilePath: (personId: string) => string;
  milestoneLink: (milestoneId: string) => string;
}) {
  const templateId = template.id;
  const scope = { templateId, spaceId: template.space.id };
  const createTask = Templates.useCreateTemplateTask(scope);
  const updateTask = Templates.useUpdateTemplateTask(scope);
  const updateAssignees = Templates.useUpdateTemplateTaskAssignees(scope);
  const deleteTask = Templates.useDeleteTemplateTask(scope);
  const moveTask = Templates.useUpdateTemplateTaskMilestoneAndOrdering(scope);
  const createMilestone = Templates.useCreateTemplateMilestone(scope);
  const updateMilestone = Templates.useUpdateTemplateMilestone(scope);
  const deleteMilestone = Templates.useDeleteTemplateMilestone(scope);
  const createPerson = Templates.useCreateTemplatePerson(scope);
  const updatePerson = Templates.useUpdateTemplatePerson(scope);
  const deletePerson = Templates.useDeleteTemplatePerson(scope);
  const updateTemplate = Templates.useUpdateTemplate(scope);
  const [graph, setGraph] = React.useState(() => mapTemplateTaskGraph(template, profilePath, milestoneLink));

  React.useEffect(() => {
    setGraph(mapTemplateTaskGraph(template, profilePath, milestoneLink));
  }, [milestoneLink, profilePath, template]);

  async function save(next: TemplateTaskGraph, request: () => Promise<unknown>, message: string) {
    setGraph(next);
    try {
      await request();
      return true;
    } catch {
      setGraph(graph);
      showErrorToast(message, "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  async function onTaskCreate(task: Omit<TemplateProjectPage.Task, "id">) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = applyCreatedTask(graph, { ...task, id: tempId });

    return save(
      optimistic,
      async () => {
        const result = await createTask.mutateAsync(taskInput(templateId, task));
        const created = toTask(result.task, task.assignees ?? []);
        if (!created) throw new Error("Created task is missing its workflow status");
        setGraph(replaceTaskId(optimistic, tempId, created));
      },
      "Task not created",
    );
  }

  function onTaskUpdate(taskId: string, updates: Partial<TemplateProjectPage.Task>) {
    return save(
      applyTaskPatch(graph, taskId, updates),
      async () => {
        const { assignees, ...fields } = updates;
        if (Object.keys(fields).length > 0) {
          await updateTask.mutateAsync({ templateId, taskId, ...taskUpdates(fields) });
        }
        if (assignees) {
          await updateAssignees.mutateAsync({ templateId, taskId, assigneeIds: activePersonIds(assignees) });
        }
      },
      "Task not updated",
    );
  }

  function onTaskDelete(taskId: string) {
    return save(
      applyTaskDeleted(graph, taskId),
      () => deleteTask.mutateAsync({ templateId, taskId }),
      "Task not deleted",
    );
  }

  function onTaskReorder(taskId: string, milestoneId: string | null, index: number) {
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

    const next = {
      ...graph,
      tasks: graph.tasks.map((task) => {
        const movedTask = moved.tasks.find((item) => compareIds(item.id, task.id));
        return movedTask ? { ...task, milestoneId: movedTask.milestoneId } : task;
      }),
      milestones: graph.milestones.map((milestone) => {
        const movedMilestone = moved.milestones.find((item) => compareIds(item.id, milestone.id));
        return movedMilestone ? { ...milestone, tasksOrderingState: movedMilestone.tasksOrderingState } : milestone;
      }),
    };

    return save(next, () => moveTask.mutateAsync({ templateId, taskId, milestoneId, index }), "Tasks not reordered");
  }

  function onMilestoneCreate(
    milestone: Omit<TemplateProjectPage.Milestone, "id" | "link" | "tasksOrderingState" | "tasksKanbanState">,
  ) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = applyCreatedMilestone(graph, {
      ...milestone,
      id: tempId,
      link: milestoneLink(tempId),
      tasksOrderingState: [],
      tasksKanbanState: {},
    });

    return save(
      optimistic,
      async () => {
        const { milestone: created } = await createMilestone.mutateAsync({
          templateId,
          title: milestone.title,
          description: serializeContent(milestone.description),
          dueOffsetDays: milestone.dueOffsetDays,
        });
        setGraph(replaceMilestoneId(optimistic, tempId, toTemplateMilestone(created, milestoneLink(created.id))));
      },
      "Milestone not created",
    );
  }

  function onMilestoneUpdate(milestoneId: string, updates: Partial<TemplateProjectPage.Milestone>) {
    return save(
      applyMilestonePatch(graph, milestoneId, updates),
      () =>
        updateMilestone.mutateAsync({
          templateId,
          milestoneId,
          title: updates.title,
          description: serializeContent(updates.description),
          dueOffsetDays: updates.dueOffsetDays,
          tasksOrderingState: updates.tasksOrderingState,
          tasksKanbanState: serializeJson(updates.tasksKanbanState),
        }),
      "Milestone not updated",
    );
  }

  function onMilestoneDelete(milestoneId: string) {
    return save(
      applyMilestoneDeleted(graph, milestoneId),
      () => deleteMilestone.mutateAsync({ templateId, milestoneId }),
      "Milestone not deleted",
    );
  }

  function onMilestoneReorder(milestoneId: string, destinationIndex: number) {
    const next = applyMilestoneReorder(graph, milestoneId, destinationIndex);
    return save(
      next,
      () =>
        updateTemplate.mutateAsync({
          id: templateId,
          milestonesOrderingState: next.milestonesOrderingState,
        }),
      "Milestones not reordered",
    );
  }

  async function onPersonCreate(person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active">) {
    if (!person.person) return false;

    const personId = person.person.id;
    const tempId = `temp-${Date.now()}`;
    const optimisticPerson = {
      ...person,
      id: tempId,
      active: true,
      person: { ...person.person, title: person.responsibility || "" },
    };
    const optimistic = applyCreatedPerson(graph, optimisticPerson);

    return save(
      optimistic,
      async () => {
        const { person: created } = await createPerson.mutateAsync({
          templateId,
          personId,
          role: person.role,
          responsibility: person.responsibility,
          accessLevel: person.accessLevel as AccessOptionsInt,
        });
        setGraph(replacePersonId(optimistic, tempId, { ...optimisticPerson, id: created.id }));
      },
      "Contributor not added",
    );
  }

  function onPersonUpdate(
    templatePersonId: string,
    updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>,
  ) {
    return save(
      applyPersonPatch(graph, templatePersonId, updates),
      () =>
        updatePerson.mutateAsync({
          templateId,
          templatePersonId,
          personId: updates.person?.id,
          role: updates.role,
          responsibility: updates.responsibility,
          accessLevel: updates.accessLevel as AccessOptionsInt | undefined,
        }),
      "Contributor not updated",
    );
  }

  function onPersonDelete(templatePersonId: string) {
    return save(
      applyPersonDeleted(graph, templatePersonId),
      () => deletePerson.mutateAsync({ templateId, templatePersonId }),
      "Contributor not removed",
    );
  }

  function onStatusesChange({
    nextStatuses,
    deletedStatusReplacements,
  }: {
    nextStatuses: TemplateProjectPage.Props["statuses"];
    deletedStatusReplacements: Record<string, string>;
  }) {
    return save(
      applyStatusesChange(graph, nextStatuses, deletedStatusReplacements),
      () =>
        updateTemplate.mutateAsync({
          id: templateId,
          taskStatuses: Tasks.serializeTaskStatuses(nextStatuses),
          deletedStatusReplacements: Object.entries(deletedStatusReplacements).map(
            ([deletedStatusId, replacementStatusId]) => ({ deletedStatusId, replacementStatusId }),
          ),
        }),
      "Workflow not updated",
    );
  }
  const kanbanTasks = React.useMemo(
    () => graph.tasks.map((task) => ({ id: task.id, status: task.status })),
    [graph.tasks],
  );

  const { kanbanState, handleTaskKanbanChange } = useKanbanState({
    type: "template",
    templateId: template.id,
    updateTask: updateTask.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    initialRawState: graph.tasksKanbanState,
    statuses: graph.statuses,
    tasks: kanbanTasks as Parameters<typeof useKanbanState>[0]["tasks"],
  });

  const onTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent) => {
      const status =
        graph.statuses.find((item) => item.value === event.to.status || item.id === event.to.status) ?? null;
      if (!status) return false;

      let previous: TemplateTaskGraph | null = null;
      setGraph((current) => {
        previous = current;
        return applyKanbanBoardPatch(current, event.updatedKanbanState, event.taskId, status);
      });

      const saved = await handleTaskKanbanChange({
        taskId: event.taskId,
        from: event.from,
        to: event.to,
        updatedKanbanState: event.updatedKanbanState,
      });

      if (!saved && previous) setGraph(previous);
      return saved;
    },
    [graph.statuses, handleTaskKanbanChange],
  );

  return {
    ...graph,
    tasksKanbanState: kanbanState,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    onTaskKanbanChange,
    onMilestoneCreate,
    onMilestoneUpdate,
    onMilestoneDelete,
    onMilestoneReorder,
    onPersonCreate,
    onPersonUpdate,
    onPersonDelete,
    onStatusesChange,
  };
}
