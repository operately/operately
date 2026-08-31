import { Status } from "../TaskBoard/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { PersonField } from "../PersonField";
import { TimelineItem, TimelineFilters } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";
import { DateField } from "../DateField";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { SidebarNotificationSection } from "../SidebarSection";
import { ProjectPermissions } from "../ProjectPage/types";
import { SpaceField } from "../SpaceField";
import { ProjectField } from "../ProjectField";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { Variant as TaskVariant, VariantFeatures as TaskVariantFeatures } from "./variantFeatures";
import type { Milestone as MilestoneFieldMilestone } from "../MilestoneField";

export namespace TaskPage {
  export type MoveDestinationType = "project" | "space";
  export type Variant = TaskVariant;
  export type VariantFeatures = TaskVariantFeatures;

  export interface MoveTaskInput {
    destinationType: MoveDestinationType;
    destinationId: string;
  }

  export interface Space {
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

  export type Person = PersonField.Person;
  export type Milestone = MilestoneFieldMilestone;

  export type ReminderType = "before_due" | "due_day" | "overdue" | "on_date";

  export interface Reminder {
    type: ReminderType;
    days?: number | null;
    date?: string | null;
  }

  export type TimelineItemType = TimelineItem;

  type PropsBase = SpaceProps & {
    // Navigation/Hierarchy
    projectName: string;
    projectLink: string;
    projectStatus: string;

    childrenCount: ProjectPageLayout.ChildrenCount;

    // Milestone selection
    milestone: Milestone | null;
    onMilestoneChange: (milestone: Milestone | null) => void;
    milestones: Milestone[];
    onMilestoneSearch: (query: string) => Promise<void>;

    // Core task data
    name: string;
    detailsLoading?: boolean;
    detailsError?: boolean;
    onRetryDetails?: () => void;
    onNameChange: (newName: string) => Promise<boolean>;

    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    status: Status | null;
    onStatusChange: (newStatus: Status) => void;

    statusOptions: Status[];

    dueDate?: DateField.ContextualDate;
    onDueDateChange: (newDate: DateField.ContextualDate | null) => void;
    reminders: Reminder[];
    onRemindersChange: (reminders: Reminder[]) => void | boolean | Promise<boolean>;

    assignees: Person[];
    onAssigneesChange: (newAssignees: Person[]) => void;

    // Metadata (read-only)
    createdAt: Date;
    createdBy: Person | null;
    closedAt: Date | null;

    // Subscriptions
    subscriptions: SidebarNotificationSection.Props;

    // Actions
    onDelete: () => Promise<void>;
    onDuplicate?: () => void;
    onArchive?: () => void;
    onMoveTask?: (input: MoveTaskInput) => Promise<boolean>;
    spaceSearch?: SpaceField.SearchSpaceFn;
    projectSearch?: ProjectField.SearchProjectFn;

    // Assignee selection
    assigneePersonSearch: PersonField.SearchData;
    richTextHandlers: RichEditorHandlers;
    localDraftKeyBase?: string;

    // Permissions
    permissions: ProjectPermissions;
    canEdit: boolean;
    canComment?: boolean;

    updateProjectName: (name: string) => Promise<boolean>;

    // Timeline/Activity feed
    timelineItems?: TimelineItem[];
    timelineIsLoading?: boolean;
    currentUser?: TimelinePerson;
    onAddComment: (content: any) => void;
    onEditComment: (id: string, content: any) => void;
    onDeleteComment: (id: string) => void;
    onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
    onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;
    timelineFilters?: TimelineFilters;
    formattedTimePreferences: FormattedTimePreferences;
  };

  export type Props =
    | (PropsBase & { variant: "project-task" | "space-task" })
    | (PropsBase & {
        variant: "template";
        dueOffsetDays?: number | null;
        onDueOffsetDaysChange: (value: number | null) => void;
      });

  type ContentPropsBase = Pick<
    PropsBase,
    | "milestone"
    | "onMilestoneChange"
    | "milestones"
    | "onMilestoneSearch"
    | "name"
    | "detailsLoading"
    | "detailsError"
    | "onRetryDetails"
    | "onNameChange"
    | "description"
    | "onDescriptionChange"
    | "status"
    | "onStatusChange"
    | "statusOptions"
    | "dueDate"
    | "onDueDateChange"
    | "reminders"
    | "onRemindersChange"
    | "assignees"
    | "onAssigneesChange"
    | "createdAt"
    | "createdBy"
    | "subscriptions"
    | "onDelete"
    | "onArchive"
    | "onMoveTask"
    | "spaceSearch"
    | "projectSearch"
    | "assigneePersonSearch"
    | "richTextHandlers"
    | "localDraftKeyBase"
    | "canEdit"
    | "timelineItems"
    | "timelineIsLoading"
    | "currentUser"
    | "canComment"
    | "onAddComment"
    | "onEditComment"
    | "onDeleteComment"
    | "onAddReaction"
    | "onRemoveReaction"
    | "timelineFilters"
    | "formattedTimePreferences"
  >;

  export type ContentProps =
    | (ContentPropsBase & { variant: "project-task" | "space-task" })
    | (ContentPropsBase & {
        variant: "template";
        dueOffsetDays?: number | null;
        onDueOffsetDaysChange: (value: number | null) => void;
      });

  type ContentStateModal = {
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;
    useMinimalistDelete?: boolean;
  };

  export type ContentState =
    | (ContentPropsBase & { variant: "project-task" | "space-task" } & ContentStateModal)
    | (ContentPropsBase & {
        variant: "template";
        dueOffsetDays?: number | null;
        onDueOffsetDaysChange: (value: number | null) => void;
      } & ContentStateModal);

  export type State = Props & {
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;
  };
}
