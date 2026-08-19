import { DateField } from "../DateField";
import * as Types from "../TaskBoard/types";
import { PersonField } from "../PersonField";
import { TimelineItem } from "../Timeline/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { SidebarNotificationSection } from "../SidebarSection";
import { ProjectPermissions } from "../ProjectPage/types";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { StatusSelector } from "../StatusSelector";
import type { TemplateProjectPage } from "../TemplateProjectPage";
import type { GetTemplateTaskPageProps } from "../TaskBoard/KanbanView/types";
import type { Variant as MilestoneVariant, VariantFeatures as MilestoneVariantFeatures } from "./variantFeatures";

export namespace MilestonePage {
  export type Variant = MilestoneVariant;
  export type VariantFeatures = MilestoneVariantFeatures;
  export type Milestone = Types.Milestone;

  export type TimelineItemType = TimelineItem;

  interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type SpaceProps =
    | {
        workmapLink: string;
        space: Space;
      }
    | {
        homeLink: string;
      };

  export type Person = {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    profileLink: string;
  };

  export type Status = "pending" | "done";

  type ProjectPropsBase = SpaceProps & {
    childrenCount: ProjectPageLayout.ChildrenCount;
    permissions: ProjectPermissions;

    projectName: string;
    projectLink: string;
    projectStatus?: string;
    updateProjectName: (name: string) => Promise<boolean>;

    milestone: Milestone;
    title: string;
    onMilestoneTitleChange: (name: string) => Promise<boolean>;
    dueDate: DateField.ContextualDate | null;
    onDueDateChange: (newDate: DateField.ContextualDate | null) => void;
    status: Status;
    onStatusChange: (status: Status) => void;
    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    onDelete?: () => void;

    tasks: Types.Task[];
    statusOptions: Types.Status[];

    onTaskCreate?: (task: Types.NewTaskPayload) => void;
    onTaskReorder?: (taskId: string, milestoneId: string | null, index: number) => void;
    onTaskMilestoneChange?: (taskId: string, milestone: Types.Milestone | null) => void;
    onTaskAssigneeChange: (taskId: string, assignees: Types.Person[]) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskRemindersChange?: Types.TaskBoardProps["onTaskRemindersChange"];
    onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;
    onTaskNameChange?: (taskId: string, name: string) => void;
    onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
    onTaskDelete?: (taskId: string) => void | Promise<unknown>;
    milestones?: Types.Milestone[];
    onMilestoneSearch?: (query: string) => Promise<void>;

    assigneePersonSearch: PersonField.SearchData;

    filters?: Types.FilterCondition[];
    onFiltersChange?: (filters: Types.FilterCondition[]) => void;

    timelineItems: TimelineItemType[];
    currentUser: Person;
    onAddComment: (comment: string) => void;
    onEditComment: (commentId: string, content: string) => void;
    onDeleteComment: (commentId: string) => void;
    onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
    onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;

    createdBy: Person | null;
    createdAt: Date;

    subscriptions: SidebarNotificationSection.Props;

    richTextHandlers: RichEditorHandlers;
    localDraftKeyBase?: string;
    formattedTimePreferences: FormattedTimePreferences;
  };

  type TemplatePropsBase = {
    template: {
      id: string;
      name: string;
      archived: boolean;
    };
    space: Space;
    projectTemplatesLink: string;
    templateLink: string;
    updateTemplateName: (name: string) => Promise<boolean>;
    permissions: ProjectPermissions;
    tasksCount: number;
    discussionsCount: number;
    docsAndFilesCount: number;

    milestoneId: string;
    title: string;
    onMilestoneTitleChange: (name: string) => Promise<boolean>;
    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;
    dueOffsetDays: number | null;
    onDueOffsetDaysChange: (value: number | null) => void;
    insertedAt?: Date;

    onDelete?: () => void;

    tasks: TemplateProjectPage.Task[];
    statuses: StatusSelector.StatusOption[];
    milestones: TemplateProjectPage.Milestone[];
    onTaskCreate?: (task: Omit<TemplateProjectPage.Task, "id">) => void;
    onTaskUpdate?: (
      taskId: string,
      updates: Partial<TemplateProjectPage.Task>,
    ) => void | boolean | Promise<void | boolean>;
    onTaskDelete?: (taskId: string) => void | boolean | Promise<void | boolean>;
    onTaskReorder?: (
      taskId: string,
      milestoneId: string | null,
      destinationIndex: number,
    ) => void | boolean | Promise<void | boolean>;
    personSearch: PersonField.SearchData;

    richTextHandlers: RichEditorHandlers;
    localDraftKeyBase?: string;
    formattedTimePreferences: FormattedTimePreferences;
  };

  export type ProjectProps = ProjectPropsBase & {
    variant: "project";
    getTaskPageProps?: Types.TaskBoardProps["getTaskPageProps"];
  };

  export type TemplateProps = TemplatePropsBase & {
    variant: "project-template";
    getTemplateTaskPageProps?: GetTemplateTaskPageProps;
  };

  export type Props = ProjectProps | TemplateProps;

  type ModalState = {
    isTaskModalOpen: boolean;
    setIsTaskModalOpen: (open: boolean) => void;
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  };

  export type ProjectState = ProjectProps & ModalState;
  export type TemplateState = TemplateProps & ModalState;
  export type State = ProjectState | TemplateState;
}

export function isProjectMilestoneProps(props: MilestonePage.Props): props is MilestonePage.ProjectProps {
  return props.variant === "project";
}

export function isTemplateMilestoneProps(props: MilestonePage.Props): props is MilestonePage.TemplateProps {
  return props.variant === "project-template";
}

export function isProjectMilestoneState(state: MilestonePage.State): state is MilestonePage.ProjectState {
  return state.variant === "project";
}

export function isTemplateMilestoneState(state: MilestonePage.State): state is MilestonePage.TemplateState {
  return state.variant === "project-template";
}
