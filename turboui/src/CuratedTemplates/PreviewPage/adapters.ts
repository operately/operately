import { addDays, format, parseISO } from "date-fns";
import { genPeople } from "../../demos/people";
import { dateInTimezone } from "../../utils/timezone";
import type { DateField } from "../../DateField";
import type { FormattedTimePreferences } from "../../FormattedTime";
import type { GoalPage } from "../../GoalPage";
import type { ProjectPage } from "../../ProjectPage";
import type { RichTextHandlers } from "../../RichContent/types";
import type { SpaceKpisPage } from "../../SpaceKpisPage/types";
import type { TaskPage } from "../../TaskPage";
import type { CuratedTemplate, TemplateDefinition, TemplatePreviewData } from "../types";

import { resolveTemplatePreviewDate } from "../previewData";

export interface PreviewOptions {
  referenceDate: string;
  formattedTimePreferences: FormattedTimePreferences;
  labels: { missing: string; pending: string };
}

export function getTemplatePreviewReferenceDate(now: Date, timezone: string): string {
  return format(dateInTimezone(now, timezone), "yyyy-MM-dd");
}

// Mutations are deliberately unavailable, even if a control is accidentally exposed.
export function unavailable(): never {
  throw new Error("Template previews are read-only");
}

export const richTextHandlers: RichTextHandlers = {
  resolveResourceLinks: null,
  mentionedPersonLookup: async () => null,
  taskList: { canEdit: false },
  onCommentTaskItemChange: null,
};

const permissions = { canView: true, canEdit: false, canComment: false, hasFullAccess: false };
const [previewChampion = null, previewReviewer = null] = genPeople(2);
const peopleSearch = { people: [], onSearch: async () => {} };
const accessLevels = { company: "view", space: "view", public: "no_access" } as const;
const subscriptions = { hidden: true, isSubscribed: false, entityType: "project" as const, onToggle: unavailable };

function dateAt(referenceDate: string, offset?: number | string | null): DateField.ContextualDate | null {
  if (offset === null || offset === undefined || offset === "") return null;
  const date = addDays(parseISO(referenceDate), Number(offset));
  return { date, dateType: "day", value: format(date, "yyyy-MM-dd") };
}

type Preview =
  | { type: "kpi"; kpi: SpaceKpisPage.Kpi; cadence: SpaceKpisPage.Cadence | null; incomplete: boolean }
  | { type: "goal"; props: GoalPage.Props; incomplete: boolean }
  | { type: "project"; props: ProjectPage.Props; incomplete: boolean };

export function buildPreview(template: CuratedTemplate, options: PreviewOptions): Preview {
  const definition: TemplateDefinition = JSON.parse(template.definition ?? "{}");
  switch (template.type) {
    case "kpi":
      return kpiPreview(template, definition, options);
    case "goal":
      return goalPreview(template, definition, options);
    case "project":
      return projectPreview(template, definition, options);
  }
}

function kpiPreview(template: CuratedTemplate, definition: TemplateDefinition, options: PreviewOptions) {
  const preview: TemplatePreviewData = JSON.parse(template.previewData ?? "{}");
  const entries: SpaceKpisPage.KpiEntry[] = (preview.entries ?? [])
    .map((entry) => ({
      id: `${template.id}-entry-${entry.period_offset}`,
      value: Number(entry.value),
      recordedAt: resolveTemplatePreviewDate(options.referenceDate, definition.cadence, entry.period_offset),
      recordedBy: null,
      commentsCount: 0,
      edits: [],
    }))
    .sort((left, right) => left.recordedAt.getTime() - right.recordedAt.getTime());
  const kpi: SpaceKpisPage.Kpi = {
    id: template.id,
    name: template.title,
    description: definition.description ?? null,
    unit: definition.unit || options.labels.missing,
    cadence: definition.cadence ?? "monthly",
    champion: previewChampion,
    insertedAt: parseISO(template.insertedAt),
    link: "",
    latestEntry: entries.at(-1) ?? null,
    entries,
    annotations: (preview.annotations ?? []).map((annotation, index) => ({
      id: `${template.id}-annotation-${index}`,
      date: resolveTemplatePreviewDate(options.referenceDate, definition.cadence, annotation.period_offset),
      title: annotation.title,
      createdBy: null,
    })),
  };
  return {
    type: "kpi" as const,
    kpi,
    cadence: definition.cadence ?? null,
    incomplete: !definition.unit || !definition.cadence,
  };
}

function sharedProps(definition: TemplateDefinition, options: PreviewOptions) {
  return {
    preview: true,
    formattedTimePreferences: options.formattedTimePreferences,
    closeLink: "",
    reopenLink: "",
    newCheckInLink: "",
    newDiscussionLink: "",
    champion: previewChampion,
    reviewer: previewReviewer,
    parentGoal: null,
    setParentGoal: unavailable,
    parentGoalSearch: async () => [],
    contributors: [],
    checkIns: [],
    discussions: [],
    closedAt: null,
    permissions,
    accessLevels,
    setAccessLevels: unavailable,
    description: definition.description ?? null,
    onDescriptionChange: unavailable,
    activityFeed: null,
    richTextHandlers,
    state: "active" as const,
    status: "pending" as const,
  };
}

function goalPreview(template: CuratedTemplate, definition: TemplateDefinition, options: PreviewOptions) {
  const targets = definition.targets ?? [];
  const props: GoalPage.Props = {
    ...sharedProps(definition, options),
    companyWorkMapLink: "",
    goalName: template.title,
    setGoalName: unavailable,
    setChampion: unavailable,
    setReviewer: unavailable,
    championSearch: peopleSearch,
    reviewerSearch: peopleSearch,
    startDate: dateAt(options.referenceDate, 0),
    dueDate: dateAt(options.referenceDate, definition.duration_days),
    setStartDate: unavailable,
    setDueDate: unavailable,
    targets: targets
      .filter((target) => target.from != null && target.to != null)
      .map((target, index) => ({
        id: `target-${index}`,
        name: target.name || options.labels.missing,
        from: Number(target.from),
        to: Number(target.to),
        value: Number(target.from),
        unit: target.unit || options.labels.missing,
        index,
        mode: "view",
      })),
    checklistItems: [],
    relatedWorkItems: [],
    childrenCount: { checkInsCount: 0, discussionsCount: 0, docsAndFilesCount: 0 },
    retrospective: null,
    neglectedGoal: false,
    addTarget: unavailable,
    deleteTarget: unavailable,
    updateTarget: unavailable,
    updateTargetValue: unavailable,
    updateTargetIndex: unavailable,
    deleteGoal: unavailable,
  };
  return {
    type: "goal" as const,
    props,
    incomplete:
      !definition.name ||
      targets.some((target) => !target.name || !target.unit || target.from == null || target.to == null),
  };
}

function projectPreview(template: CuratedTemplate, definition: TemplateDefinition, options: PreviewOptions) {
  const status: ProjectPage.TaskStatus = {
    id: "pending",
    value: "pending",
    label: options.labels.pending,
    color: "gray",
    icon: "circleDashed",
    index: 0,
    closed: false,
  };
  const milestones: ProjectPage.Milestone[] = (definition.milestones ?? []).map((milestone) => ({
    id: previewId(milestone.key),
    name: milestone.title || options.labels.missing,
    status: "pending",
    dueDate: dateAt(options.referenceDate, milestone.due_offset_days),
    link: "?tab=tasks",
    tasksOrderingState: (definition.tasks ?? [])
      .filter((task) => task.milestone_key === milestone.key)
      .map((task) => previewId(task.key)),
  }));
  const tasks: ProjectPage.Task[] = (definition.tasks ?? []).map(({ milestone_key: milestoneKey, ...task }) => ({
    id: previewId(task.key),
    title: task.name || options.labels.missing,
    type: "project",
    status,
    description: task.description ? JSON.stringify(task.description) : null,
    milestone: milestoneKey ? (milestones.find((milestone) => milestone.id === previewId(milestoneKey)) ?? null) : null,
    dueDate: dateAt(options.referenceDate, task.due_offset_days),
    assignees: [],
    link: "",
  }));
  const props: ProjectPage.Props = {
    ...sharedProps(definition, options),
    homeLink: "",
    pauseLink: "",
    project: { id: template.id, name: template.title },
    updateProjectName: unavailable,
    startedAt: dateAt(options.referenceDate, 0),
    dueAt: dateAt(options.referenceDate, definition.duration_days),
    otherPeopleWithAccess: { people: [], loading: false, onRequestLoad: unavailable },
    subscriptions,
    childrenCount: { tasksCount: tasks.length, checkInsCount: 0, discussionsCount: 0, docsAndFilesCount: 0 },
    onProjectDelete: unavailable,
    tasks,
    milestones,
    searchableMilestones: milestones,
    statuses: [status],
    kanbanState: { pending: tasks.map((task) => task.id) },
    tasksView: "list",
    onTasksViewChange: unavailable,
    onMilestoneCreate: unavailable,
    onMilestoneUpdate: unavailable,
    onMilestoneReorder: unavailable,
    onMilestoneSearch: async () => {},
    assigneePersonSearch: peopleSearch,
    getTaskPageProps: (id) => {
      const task = tasks.find((task) => task.id === id);
      return task ? taskPreview(task, template, options) : null;
    },
  };
  return {
    type: "project" as const,
    props,
    incomplete:
      (definition.milestones ?? []).some((m) => !m.title) ||
      (definition.tasks ?? []).some((task) => !task.name) ||
      !definition.name,
  };
}

function previewId(key: string): string {
  // Shared ID helpers treat hyphens as slug separators. Escape them to preserve the entire template key.
  return encodeURIComponent(key).replace(/-/g, "%2D");
}

function taskPreview(
  task: ProjectPage.Task,
  template: CuratedTemplate,
  options: PreviewOptions,
): TaskPage.ContentProps {
  return {
    variant: "project-task",
    name: task.title,
    description: task.description ? JSON.parse(task.description) : null,
    status: task.status,
    statusOptions: task.status ? [task.status] : [],
    dueDate: task.dueDate ?? undefined,
    milestone: task.milestone,
    milestones: [],
    assignees: [],
    reminders: [],
    createdAt: parseISO(template.insertedAt),
    createdBy: null,
    subscriptions: { ...subscriptions, entityType: "project_task" },
    canEdit: false,
    canComment: false,
    richTextHandlers,
    assigneePersonSearch: peopleSearch,
    formattedTimePreferences: options.formattedTimePreferences,
    onMilestoneChange: unavailable,
    onMilestoneSearch: async () => {},
    onNameChange: unavailable,
    onDescriptionChange: unavailable,
    onStatusChange: unavailable,
    onDueDateChange: unavailable,
    onRemindersChange: unavailable,
    onAssigneesChange: unavailable,
    onDelete: unavailable,
    timelineItems: [],
    onAddComment: unavailable,
    onEditComment: unavailable,
    onDeleteComment: unavailable,
  };
}
