import React from "react";
import { ProjectPageLayout } from "../ProjectPageLayout";
import type { ProjectPermissions } from "../ProjectPage/types";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { StatusSelector } from "../StatusSelector";
import type { PersonField } from "../PersonField";
import { IconClipboardText, IconListCheck } from "../icons";
import { useTabs } from "../Tabs";
import { Overview } from "./Overview";
import { TaskBoard } from "./TaskBoard";

export function TemplateProjectPage(props: TemplateProjectPage.Props) {
  const orderedProps = React.useMemo(() => orderTemplateGraph(props), [props]);
  const canEdit = Boolean(props.permissions.canEdit || props.permissions.hasFullAccess);
  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "tasks", label: "Tasks", icon: <IconListCheck size={14} />, count: props.tasks.length },
  ]);

  return (
    <ProjectPageLayout
      mode="template"
      title={[props.template.name]}
      testId="project-template-page"
      projectName={props.template.name}
      updateProjectName={async (name) => (await props.onTemplateUpdate({ name })) !== false}
      permissions={props.permissions}
      space={props.space}
      workmapLink={props.projectTemplatesLink}
      projectTemplatesLink={props.projectTemplatesLink}
      tabs={tabs}
    >
      <div className="flex-1 overflow-auto">
        {tabs.active === "tasks" ? (
          <TaskBoard props={orderedProps} canEdit={canEdit} />
        ) : (
          <Overview props={orderedProps} canEdit={canEdit} />
        )}
      </div>
    </ProjectPageLayout>
  );
}

export namespace TemplateProjectPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Milestone {
    id: string;
    title: string;
    description: any;
    dueOffsetDays: number | null;
    tasksOrderingState: string[];
    tasksKanbanState: unknown;
  }

  export interface Reminder {
    type: "before_due" | "due_day" | "overdue";
    days?: number | null;
  }

  export interface Task {
    id: string;
    name: string;
    description: any;
    milestoneId: string | null;
    priority: string | null;
    size: string | null;
    dueOffsetDays: number | null;
    status: StatusSelector.StatusOption;
    reminders: Reminder[];
    assignees?: TemplatePerson[];
  }

  export interface TemplatePerson {
    id: string;
    person: PersonField.Person | null;
    role: "champion" | "reviewer" | "contributor";
    responsibility: string | null;
    accessLevel: number;
    active: boolean;
  }

  export interface Props {
    template: {
      id: string;
      name: string;
      description: any;
      durationDays: number | null;
      milestonesOrderingState: string[];
      tasksKanbanState: unknown;
    };
    space: Space;
    projectTemplatesLink: string;
    permissions: ProjectPermissions;
    statuses: StatusSelector.StatusOption[];
    milestones: Milestone[];
    tasks: Task[];
    people?: TemplatePerson[];
    richTextHandlers: RichEditorHandlers;
    onTemplateUpdate: (updates: Partial<Props["template"]>) => void | boolean | Promise<void | boolean>;
    onStatusesChange?: (payload: {
      nextStatuses: StatusSelector.StatusOption[];
      deletedStatusReplacements: Record<string, string>;
    }) => void;
    onMilestoneCreate?: (milestone: Omit<Milestone, "id" | "tasksOrderingState" | "tasksKanbanState">) => void;
    onMilestoneUpdate?: (milestoneId: string, updates: Partial<Milestone>) => void | Promise<void>;
    onMilestoneDelete?: (milestoneId: string) => void | Promise<void>;
    onMilestoneReorder?: (milestoneId: string, destinationIndex: number) => void | Promise<void>;
    onTaskCreate?: (task: Omit<Task, "id">) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void | Promise<void>;
    onTaskDelete?: (taskId: string) => void | Promise<void>;
    onTaskReorder?: (taskId: string, milestoneId: string | null, destinationIndex: number) => void | Promise<void>;
  }
}

function orderTemplateGraph(props: TemplateProjectPage.Props): TemplateProjectPage.Props {
  const milestones = orderByIds(props.milestones, props.template.milestonesOrderingState);
  const milestoneOrder = new Map(milestones.map((milestone) => [milestone.id, milestone.tasksOrderingState]));
  const rootOrder = flattenKanban(
    props.template.tasksKanbanState,
    props.statuses.map((status) => status.value || status.id),
  );

  return {
    ...props,
    milestones,
    tasks: props.tasks.slice().sort((left, right) => taskIndex(left) - taskIndex(right)),
  };

  function taskIndex(task: TemplateProjectPage.Task) {
    const ids = task.milestoneId ? (milestoneOrder.get(task.milestoneId) ?? []) : rootOrder;
    const index = ids.indexOf(task.id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }
}

function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return items
    .slice()
    .sort(
      (left, right) =>
        (positions.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

function flattenKanban(state: unknown, statusIds: string[]): string[] {
  if (!state || typeof state !== "object" || Array.isArray(state)) return [];
  const columns = state as Record<string, unknown>;
  return statusIds.flatMap((statusId) => {
    const column = columns[statusId];
    return Array.isArray(column) ? column.filter((id): id is string => typeof id === "string") : [];
  });
}
