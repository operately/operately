import React from "react";
import {
  type FormattedTimePreferences,
  type GetTemplateTaskPageProps,
  type TaskPage,
  type TemplateProjectPage,
} from "turboui";
import { compareIds } from "@/routes/paths";

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

export function useTemplateTaskSlideInProps(opts: {
  canEdit: boolean;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { canEdit, formattedTimePreferences } = opts;
  const getTemplateTaskPageProps = React.useCallback<GetTemplateTaskPageProps>(
    (taskId, ctx) => buildTemplateTaskPageProps(taskId, ctx, { canEdit, formattedTimePreferences }),
    [canEdit, formattedTimePreferences],
  );

  return React.useMemo(() => ({ getTemplateTaskPageProps }), [getTemplateTaskPageProps]);
}

export function buildTemplateTaskPageProps(
  taskId: string,
  ctx: Parameters<GetTemplateTaskPageProps>[1],
  opts: { canEdit: boolean; formattedTimePreferences: FormattedTimePreferences },
): TaskPage.ContentProps | null {
  const task = ctx.tasks.find((item) => compareIds(item.id, taskId));
  if (!task || !ctx.richTextHandlers) return null;

  const selectedMilestone = ctx.milestones.find((milestone) => compareIds(milestone.id, task.milestoneId)) ?? null;

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
    canEdit: opts.canEdit,
    onAddComment: () => undefined,
    onEditComment: () => undefined,
    onDeleteComment: () => undefined,
    formattedTimePreferences: opts.formattedTimePreferences,
    localDraftKeyBase: `template-task:${taskId}`,
  };
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
