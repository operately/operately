import React from "react";
import { ProjectPageLayout } from "../ProjectPageLayout";
import {
  ProjectTemplateLifecycle,
  ProjectTemplateLifecycleAction,
  ProjectTemplateLifecycleDialogs,
} from "../ProjectTemplateLifecycle";
import type { ProjectPermissions } from "../ProjectPage/types";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { StatusSelector } from "../StatusSelector";
import type { PersonField } from "../PersonField";
import type { AddFileWidgetProps } from "../ResourceHub/AddFileWidget";
import { IconClipboardText, IconListCheck, IconMessageCircle, IconPaperclip } from "../icons";
import { useTabs } from "../Tabs";
import { orderByIds } from "../utils/orderByIds";
import { Overview } from "./Overview";
import { TaskBoard } from "./TaskBoard";
import { Discussions } from "./Discussions";
import { DocsAndFiles } from "./DocsAndFiles";

export function TemplateProjectPage(props: TemplateProjectPage.Props) {
  const orderedProps = React.useMemo(() => orderTemplateGraph(props), [props]);
  const canEdit = !props.template.archived && Boolean(props.permissions.canEdit || props.permissions.hasFullAccess);
  const [lifecycleAction, setLifecycleAction] = React.useState<ProjectTemplateLifecycleAction | null>(null);
  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "tasks", label: "Tasks", icon: <IconListCheck size={14} />, count: props.tasks.length },
    { id: "discussions", label: "Discussions", icon: <IconMessageCircle size={14} />, count: props.discussions.length },
    {
      id: "docs-and-files",
      label: "Docs & Files",
      icon: <IconPaperclip size={14} />,
      count: props.resourceNodes?.length ?? 0,
    },
  ]);

  return (
    <>
      <ProjectPageLayout
        mode="template"
        title={[props.template.name]}
        testId="project-template-page"
        projectName={props.template.name}
        updateProjectName={async (name) => (await props.onTemplateUpdate({ name })) !== false}
        permissions={{ ...props.permissions, canEdit }}
        space={props.space}
        workmapLink={props.projectTemplatesLink}
        projectTemplatesLink={props.projectTemplatesLink}
        tabs={tabs}
        archived={props.template.archived}
      >
        <div className="flex-1 overflow-auto">
          {tabs.active === "tasks" && <TaskBoard props={orderedProps} canEdit={canEdit} />}
          {tabs.active === "discussions" && <Discussions props={orderedProps} canEdit={canEdit} />}
          {tabs.active === "docs-and-files" && <DocsAndFiles props={orderedProps} canEdit={canEdit} />}
          {tabs.active === "overview" && (
            <Overview props={orderedProps} canEdit={canEdit} onLifecycleAction={setLifecycleAction} />
          )}
        </div>
      </ProjectPageLayout>
      <ProjectTemplateLifecycleDialogs
        action={lifecycleAction}
        template={props.template}
        onClose={() => setLifecycleAction(null)}
        onDuplicate={props.onDuplicate}
        onArchive={props.onArchive}
        onRestore={props.onRestore}
        onDelete={props.onDelete}
      />
    </>
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
    link: string;
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

  export interface Discussion {
    id: string;
    title: string;
    author: PersonField.Person | null;
    date: Date;
    link: string;
    content: any;
  }

  export interface ResourceNode {
    id: string;
    parentFolderId: string | null;
    folderId?: string | null;
    type: "folder" | "document" | "file" | "link";
    position: number;
    name: string;
    link: string;
    insertedAt: string;
    updatedAt: string;
    fileKind?: "audio" | "default" | "image" | "mov" | "pdf" | "video" | "zip";
    thumbnail?: {
      url: string;
      alt: string;
      width?: number | null;
      height?: number | null;
    } | null;
  }

  export interface Props {
    template: {
      id: string;
      name: string;
      description: any;
      durationDays: number | null;
      milestonesOrderingState: string[];
      tasksKanbanState: unknown;
      archived: boolean;
    };
    space: Space;
    projectTemplatesLink: string;
    permissions: ProjectPermissions;
    statuses: StatusSelector.StatusOption[];
    milestones: Milestone[];
    tasks: Task[];
    discussions: Discussion[];
    resourceNodes?: ResourceNode[];
    onFolderCreate: (parentFolderId: string | null, name: string) => Promise<boolean>;
    onFolderRename?: (folderId: string, name: string) => Promise<boolean>;
    onResourceDelete?: (nodeId: string) => Promise<boolean>;
    onResourceMove?: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
    onFilesUpload: (
      items: Parameters<AddFileWidgetProps["onUpload"]>[0],
      onProgress: Parameters<AddFileWidgetProps["onUpload"]>[1],
      parentFolderId: string | null,
    ) => Promise<boolean>;
    formatFileSize: AddFileWidgetProps["formatFileSize"];
    newDiscussionLink?: string;
    newDocumentLink: string;
    newLinkLink: string;
    people?: TemplatePerson[];
    personSearch: PersonField.SearchData;
    contributorPersonSearch: PersonField.SearchData;
    richTextHandlers: RichEditorHandlers;
    formattedTimePreferences: FormattedTimePreferences;
    onTemplateUpdate: (updates: Partial<Props["template"]>) => void | boolean | Promise<void | boolean>;
    onStatusesChange?: (payload: {
      nextStatuses: StatusSelector.StatusOption[];
      deletedStatusReplacements: Record<string, string>;
    }) => void;
    onMilestoneCreate?: (milestone: Omit<Milestone, "id" | "link" | "tasksOrderingState" | "tasksKanbanState">) => void;
    onMilestoneUpdate?: (milestoneId: string, updates: Partial<Milestone>) => void | boolean | Promise<void | boolean>;
    onMilestoneDelete?: (milestoneId: string) => void | boolean | Promise<void | boolean>;
    onMilestoneReorder?: (milestoneId: string, destinationIndex: number) => void | boolean | Promise<void | boolean>;
    onTaskCreate?: (task: Omit<Task, "id">) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void | boolean | Promise<void | boolean>;
    onTaskDelete?: (taskId: string) => void | boolean | Promise<void | boolean>;
    onTaskReorder?: (
      taskId: string,
      milestoneId: string | null,
      destinationIndex: number,
    ) => void | boolean | Promise<void | boolean>;
    onPersonCreate?: (person: Omit<TemplatePerson, "id" | "active">) => void | boolean | Promise<void | boolean>;
    onPersonUpdate?: (
      templatePersonId: string,
      updates: Partial<Omit<TemplatePerson, "id" | "active">>,
    ) => void | boolean | Promise<void | boolean>;
    onPersonDelete?: (templatePersonId: string) => void | boolean | Promise<void | boolean>;
    onDuplicate: ProjectTemplateLifecycle.Handlers["onDuplicate"];
    onArchive: ProjectTemplateLifecycle.Handlers["onArchive"];
    onRestore: ProjectTemplateLifecycle.Handlers["onRestore"];
    onDelete: ProjectTemplateLifecycle.Handlers["onDelete"];
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

function flattenKanban(state: unknown, statusIds: string[]): string[] {
  if (!state || typeof state !== "object" || Array.isArray(state)) return [];
  const columns = state as Record<string, unknown>;
  return statusIds.flatMap((statusId) => {
    const column = columns[statusId];
    return Array.isArray(column) ? column.filter((id): id is string => typeof id === "string") : [];
  });
}
