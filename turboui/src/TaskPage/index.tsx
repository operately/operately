import React from "react";
import { Status } from "../TaskBoard/types";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { TimelineItem, TimelineFilters } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";
import { DateField } from "../DateField";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useTabs } from "../Tabs";
import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";

import { PageHeader } from "./PageHeader";
import { Overview } from "./Overview";
import { Sidebar } from "./Sidebar";
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
    tasksCount?: number;
    projectStatus: string;

    space: Space;

    // Milestone selection
    milestone: Milestone | null;
    onMilestoneChange: (milestone: Milestone | null) => void;
    searchMilestones: (params: { query: string }) => Promise<Milestone[]>;

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

    // Subscription
    isSubscribed: boolean;
    onSubscriptionToggle: (subscribed: boolean) => void;

    // Actions
    onDelete: () => Promise<void>;
    onDuplicate?: () => void;
    onArchive?: () => void;

    // Search functionality for assignees
    searchPeople: SearchFn;
    mentionedPersonLookup: MentionedPersonLookupFn;
    mentionedPeopleSearch: SearchFn;

    // Permissions
    canEdit: boolean;

    updateProjectName: (name: string) => Promise<boolean>;

    // Timeline/Activity feed
    timelineItems?: TimelineItem[];
    currentUser?: TimelinePerson;
    canComment?: boolean;
    onAddComment?: (content: any) => void;
    onEditComment?: (id: string, content: any) => void;
    timelineFilters?: TimelineFilters;

    notifications?: any;
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
        count: state.tasksCount,
      },
      { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
      { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    { urlPath: state.projectLink },
  );

  return (
    <ProjectPageLayout {...state} title={[state.projectName]} testId="project-page" tabs={tabs} status={state.projectStatus}>
      <div className="px-4 py-4 flex-1 overflow-scroll">
        <PageHeader {...state} />
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-6">
            <div className="sm:grid sm:grid-cols-12">
              <Overview {...state} />
              <Sidebar {...state} />
            </div>
          </div>
        </div>
      </div>

      <DeleteModal {...state} />
    </ProjectPageLayout>
  );
}
