import React from "react";
import { ProjectPageLayout } from "../ProjectPageLayout";
import type { ProjectPermissions } from "../ProjectPage/types";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { StatusSelector } from "../StatusSelector";
import { IconClipboardText, IconListCheck } from "../icons";
import { useTabs } from "../Tabs";
import { Overview } from "./Overview";
import { TaskBoard } from "./TaskBoard";

export function TemplateProjectPage(props: TemplateProjectPage.Props) {
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
          <TaskBoard props={props} canEdit={canEdit} />
        ) : (
          <Overview props={props} canEdit={canEdit} />
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
    richTextHandlers: RichEditorHandlers;
    onTemplateUpdate: (updates: Partial<Props["template"]>) => void | boolean | Promise<void | boolean>;
    onStatusesChange?: (statuses: StatusSelector.StatusOption[]) => void;
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
