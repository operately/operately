import React from "react";
import { Status } from "../TaskBoard/types";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { TimelineItem, TimelineFilters } from "../Timeline/types";
import { PageNew } from "../Page";
import { useTabs } from "../Tabs";
import { Tabs } from "../Tabs";
import { IconClipboardText, IconMessage, IconLogs, IconListCheck, IconMessages } from "../icons";
import { Person as TimelinePerson } from "../CommentSection/types";
import { DateField } from "../DateField";

import { PageHeader } from "./PageHeader";
import { Overview } from "./Overview";
import { Sidebar } from "./Sidebar";

export namespace TaskPage {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  }

  export interface Milestone {
    id: string;
    title: string;
    dueDate?: DateField.ContextualDate;
    status?: "pending" | "complete" | "overdue";
    projectLink?: string;
  }

  export interface Props {
    // Navigation/Hierarchy
    spaceLink: string;
    spaceName: string;
    projectLink: string;
    projectName: string;
    milestoneLink: string;
    milestoneName: string;
    workmapLink: string;

    // Milestone selection
    milestone?: Milestone | null;
    onMilestoneChange?: (milestone: Milestone | null) => void;

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

    // Subscription
    isSubscribed: boolean;
    onSubscriptionToggle: (subscribed: boolean) => void;

    // Actions
    onCopyUrl: () => void;
    onDelete: () => Promise<void>;
    onDuplicate?: () => void;
    onArchive?: () => void;

    // Search functionality for assignees
    searchPeople?: (params: { query: string }) => Promise<Person[]>;

    // Search functionality for milestones
    searchMilestones?: (params: { query: string }) => Promise<Milestone[]>;
    onCreateMilestone?: (title?: string) => void;

    // Search functionality for rich editor mentions
    peopleSearch?: SearchFn;

    // Person lookup for rich content mentions
    mentionedPersonLookup: MentionedPersonLookupFn;

    // Permissions
    canEdit: boolean;

    // Timeline/Activity feed
    timelineItems?: TimelineItem[];
    currentUser?: TimelinePerson;
    canComment?: boolean;
    onAddComment?: (content: any) => void;
    onEditComment?: (id: string, content: any) => void;
    timelineFilters?: TimelineFilters;
  }

  export interface State extends Props {
    // Add any additional state management here if needed
  }
}

function useTaskPageState(props: TaskPage.Props): TaskPage.State {
  return {
    ...props,
  };
}

export function TaskPage(props: TaskPage.Props) {
  const state = useTaskPageState(props);

  const tabs = useTabs("tasks", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "tasks", label: "Tasks", icon: <IconListCheck size={14} /> },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[state.name]} size="fullwidth" testId="task-page">
      <PageHeader {...state} />
      <Tabs tabs={tabs} />

      <div className="flex-1 overflow-scroll">
        <div className="px-4 py-6">
          <div className="sm:grid sm:grid-cols-12">
            <Overview {...state} />
            <Sidebar {...state} />
          </div>
        </div>
      </div>
    </PageNew>
  );
}
