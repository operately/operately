import * as React from "react";
import type { TaskPage } from "../../TaskPage";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import type { GetTemplateTaskPageProps, TemplateTaskSlideInContext } from "../../TaskBoard/KanbanView/types";
import { defaultFormattedTimePreferences } from "./formattedTime";

const EMPTY_SUBSCRIPTIONS: TaskPage.ContentProps["subscriptions"] = {
  isSubscribed: false,
  hidden: true,
  entityType: "project_task",
  subscribedPeople: [],
  onToggle: () => undefined,
};

const EMPTY_PERSON_SEARCH: TaskPage.ContentProps["assigneePersonSearch"] = {
  people: [],
  onSearch: async () => undefined,
};

function updateTask(
  tasks: TemplateProjectPage.Task[],
  taskId: string,
  updater: (task: TemplateProjectPage.Task) => TemplateProjectPage.Task,
) {
  return tasks.map((task) => (task.id === taskId ? updater(task) : task));
}

function toTaskPageMilestone(milestone: TemplateProjectPage.Milestone): TaskPage.Milestone {
  return {
    id: milestone.id,
    name: milestone.title,
    dueDate: null,
    status: "pending",
  };
}

function toTaskPagePerson(person: NonNullable<TemplateProjectPage.TemplatePerson["person"]>): TaskPage.Person {
  return {
    id: person.id,
    fullName: person.fullName,
    avatarUrl: person.avatarUrl,
    profileLink: person.profileLink ?? "#",
  };
}

function activeAssignees(assignees: TemplateProjectPage.TemplatePerson[] | undefined): TaskPage.Person[] {
  return (assignees ?? []).flatMap((assignee) =>
    assignee.active && assignee.person ? [toTaskPagePerson(assignee.person)] : [],
  );
}

function toTemplateAssignees(
  people: TaskPage.Person[],
  previous: TemplateProjectPage.TemplatePerson[] | undefined,
): TemplateProjectPage.TemplatePerson[] {
  const previousByPersonId = new Map(
    (previous ?? []).flatMap((assignee) => (assignee.person ? [[assignee.person.id, assignee] as const] : [])),
  );

  return people.map(
    (person) =>
      previousByPersonId.get(person.id) ?? {
        id: person.id,
        person: { id: person.id, fullName: person.fullName, avatarUrl: person.avatarUrl },
        role: "contributor" as const,
        responsibility: null,
        accessLevel: 70,
        active: true,
      },
  );
}

export function templateTaskToContentProps(
  taskId: string,
  ctx: TemplateTaskSlideInContext,
): TaskPage.ContentProps | null {
  const task = ctx.tasks.find((item) => item.id === taskId);
  if (!task || !ctx.richTextHandlers) return null;

  const selectedMilestone = ctx.milestones.find((milestone) => milestone.id === task.milestoneId) ?? null;

  return {
    variant: "template",
    name: task.name,
    onNameChange: async (name) => {
      await ctx.onTaskUpdate?.(taskId, { name });
      return true;
    },
    description: task.description,
    onDescriptionChange: async (description) => {
      await ctx.onTaskUpdate?.(taskId, { description });
      return true;
    },
    status: task.status,
    onStatusChange: (status) => {
      void ctx.onTaskUpdate?.(taskId, { status });
    },
    statusOptions: ctx.statuses,
    dueDate: undefined,
    onDueDateChange: () => undefined,
    dueOffsetDays: task.dueOffsetDays,
    onDueOffsetDaysChange: (dueOffsetDays) => {
      void ctx.onTaskUpdate?.(taskId, { dueOffsetDays });
    },
    reminders: [],
    onRemindersChange: async () => true,
    milestone: selectedMilestone ? toTaskPageMilestone(selectedMilestone) : null,
    onMilestoneChange: (next) => {
      void ctx.onTaskUpdate?.(taskId, { milestoneId: next?.id ?? null });
    },
    milestones: ctx.milestones.map(toTaskPageMilestone),
    onMilestoneSearch: async () => undefined,
    assignees: activeAssignees(task.assignees),
    onAssigneesChange: (people) => {
      void ctx.onTaskUpdate?.(taskId, { assignees: toTemplateAssignees(people, task.assignees) });
    },
    createdAt: new Date(),
    createdBy: null,
    subscriptions: EMPTY_SUBSCRIPTIONS,
    onDelete: async () => {
      await ctx.onTaskDelete?.(taskId);
    },
    assigneePersonSearch: ctx.personSearch ?? EMPTY_PERSON_SEARCH,
    richTextHandlers: ctx.richTextHandlers,
    canEdit: true,
    onAddComment: () => undefined,
    onEditComment: () => undefined,
    onDeleteComment: () => undefined,
    formattedTimePreferences: defaultFormattedTimePreferences,
    localDraftKeyBase: `template-task:${taskId}`,
  };
}

export function useMockTemplateTaskSlideIn(opts: {
  tasks: TemplateProjectPage.Task[];
  setTasks: React.Dispatch<React.SetStateAction<TemplateProjectPage.Task[]>>;
  milestones: TemplateProjectPage.Milestone[];
  statuses: TemplateProjectPage.Props["statuses"];
  personSearch?: TemplateProjectPage.Props["personSearch"];
  richTextHandlers: TemplateProjectPage.Props["richTextHandlers"];
}): {
  onTaskCreate: (task: Omit<TemplateProjectPage.Task, "id">) => void;
  onTaskUpdate: (
    taskId: string,
    updates: Partial<TemplateProjectPage.Task>,
  ) => boolean | void | Promise<boolean | void>;
  onTaskDelete: (taskId: string) => void | Promise<void>;
  onTaskReorder: (
    taskId: string,
    milestoneId: string | null,
    destinationIndex: number,
  ) => boolean | void | Promise<boolean | void>;
  getTemplateTaskPageProps: GetTemplateTaskPageProps;
} {
  const { setTasks } = opts;

  const onTaskCreate = React.useCallback((task: Omit<TemplateProjectPage.Task, "id">) => {
    const id = `template-task-${Math.random().toString(36).slice(2)}`;
    setTasks((prev) => [...prev, { ...task, id }]);
  }, [setTasks]);

  const onTaskUpdate = React.useCallback(
    (taskId: string, updates: Partial<TemplateProjectPage.Task>) => {
      setTasks((prev) => updateTask(prev, taskId, (task) => ({ ...task, ...updates })));
      return true;
    },
    [setTasks],
  );

  const onTaskDelete = React.useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    },
    [setTasks],
  );

  const onTaskReorder = React.useCallback(
    (taskId: string, nextMilestoneId: string | null, destinationIndex: number) => {
      setTasks((prev) => {
        const task = prev.find((item) => item.id === taskId);
        if (!task) return prev;

        const remaining = prev.filter((item) => item.id !== taskId);
        const destinationTasks = remaining.filter((item) => item.milestoneId === nextMilestoneId);
        const movedTask = { ...task, milestoneId: nextMilestoneId };
        const boundedIndex = Math.max(0, Math.min(destinationIndex, destinationTasks.length));
        const nextDestination = destinationTasks[boundedIndex];

        if (nextDestination) {
          const insertionIndex = remaining.findIndex((item) => item.id === nextDestination.id);
          remaining.splice(insertionIndex, 0, movedTask);
        } else {
          remaining.push(movedTask);
        }

        return remaining;
      });
      return true;
    },
    [setTasks],
  );

  const getTemplateTaskPageProps = React.useCallback<GetTemplateTaskPageProps>(
    (taskId, ctx) => templateTaskToContentProps(taskId, ctx),
    [],
  );

  return {
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    getTemplateTaskPageProps,
  };
}

export function useMockTemplateMilestoneTaskActions(opts: {
  milestoneId: string;
  milestones: TemplateProjectPage.Milestone[];
  initialTasks: TemplateProjectPage.Task[];
  statuses: TemplateProjectPage.Props["statuses"];
  personSearch?: TemplateProjectPage.Props["personSearch"];
  richTextHandlers: TemplateProjectPage.Props["richTextHandlers"];
}) {
  const [tasks, setTasks] = React.useState(
    opts.initialTasks.filter((task) => task.milestoneId === opts.milestoneId),
  );

  const actions = useMockTemplateTaskSlideIn({
    tasks,
    setTasks,
    milestones: opts.milestones,
    statuses: opts.statuses,
    personSearch: opts.personSearch,
    richTextHandlers: opts.richTextHandlers,
  });

  return { tasks, setTasks, ...actions };
}
