import React from "react";
import { Status } from "../TaskBoard/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { PersonField } from "../PersonField";
import { TimelineItem, TimelineFilters } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";
import { DateField } from "../DateField";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useTabs } from "../Tabs";
import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";
import { SidebarNotificationSection } from "../SidebarSection";

import { PageHeader } from "./PageHeader";
import { Overview } from "./Overview";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { DeleteModal } from "./DeleteModal";

export namespace TaskPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    profileLink: string;
  }

  export interface Milestone {
    id: string;
    name: string;
    dueDate: DateField.ContextualDate | null;
    status: "pending" | "done";
    link?: string;
  }

  export type TimelineItemType = TimelineItem;

  export interface Props {
    // Navigation/Hierarchy
    projectName: string;
    projectLink: string;
    workmapLink: string;
    projectStatus: string;

    childrenCount: ProjectPageLayout.ChildrenCount;

    space: Space;

    // Milestone selection
    milestone: Milestone | null;
    onMilestoneChange: (milestone: Milestone | null) => void;
    milestones: Milestone[];
    onMilestoneSearch: (query: string) => Promise<void>;

    // Core task data
    name: string;
    onNameChange: (newName: string) => Promise<boolean>;

    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    status: Status;
    onStatusChange: (newStatus: Status) => void;

    dueDate?: DateField.ContextualDate;
    onDueDateChange: (newDate: DateField.ContextualDate | null) => void;

    assignee: Person | null;
    onAssigneeChange: (newAssignee: Person | null) => void;

    // Metadata (read-only)
    createdAt: Date;
    createdBy: Person;
    closedAt: Date | null;

    // Subscriptions
    subscriptions: SidebarNotificationSection.Props;

    // Actions
    onDelete: () => Promise<void>;
    onDuplicate?: () => void;
    onArchive?: () => void;

    // Assignee selection
    assigneePersonSearch: PersonField.SearchData;
    richTextHandlers: RichEditorHandlers;

    // Permissions
    canEdit: boolean;

    updateProjectName: (name: string) => Promise<boolean>;

    // Timeline/Activity feed
    timelineItems?: TimelineItem[];
    currentUser?: TimelinePerson;
    canComment?: boolean;
    onAddComment: (content: any) => void;
    onEditComment: (id: string, content: any) => void;
    onAddReaction?: (commentId: string, emoji: string) => void | Promise<void>;
    onRemoveReaction?: (commentId: string, reactionId: string) => void | Promise<void>;
    timelineFilters?: TimelineFilters;
  }

  export interface State extends Props {
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  }
}

function useTaskPageState(props: TaskPage.Props): TaskPage.State {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  return {
    ...props,

    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };
}

export function TaskPage(props: TaskPage.Props) {
  const state = useTaskPageState(props);

  const tabs = useTabs(
    "tasks",
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      {
        id: "tasks",
        label: "Tasks",
        icon: <IconListCheck size={14} />,
        count: state.childrenCount.tasksCount,
      },
      {
        id: "check-ins",
        label: "Check-ins",
        icon: <IconMessage size={14} />,
        count: state.childrenCount.checkInsCount,
      },
      {
        id: "discussions",
        label: "Discussions",
        icon: <IconMessages size={14} />,
        count: state.childrenCount.discussionsCount,
      },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    { urlPath: state.projectLink },
  );

  return (
    <ProjectPageLayout
      {...state}
      title={[state.projectName]}
      testId="project-page"
      tabs={tabs}
      status={state.projectStatus}
    >
      <div className="flex-1 overflow-auto">
        <div className="p-4 max-w-6xl mx-auto">
          <PageHeader {...state} />
          <MobileSidebar {...state} />
          <div className="sm:grid sm:grid-cols-12 mt-6">
            <Overview {...state} />
            <Sidebar {...state} />
          </div>
        </div>
      </div>

      <DeleteModal {...state} />
    </ProjectPageLayout>
  );
}
