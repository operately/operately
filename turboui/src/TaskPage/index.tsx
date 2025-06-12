import React from "react";
import { PageNew } from "../Page";
import { Status } from "../TaskBoard/types";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

import { PageHeader } from "./PageHeader";
import { Overview } from "./Overview";
import { Sidebar } from "./Sidebar";
import { pageOptions } from "./PageOptions";

export namespace TaskPage {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  }

  export interface Props {
    // Navigation/Hierarchy
    spaceLink: string;
    spaceName: string;
    projectLink?: string;
    projectName?: string;
    milestoneLink?: string;
    milestoneName?: string;

    // Core task data
    name: string;
    onNameChange: (newName: string) => Promise<boolean>;

    description: any;
    onDescriptionChange: (newDescription: any) => Promise<boolean>;

    status: Status;
    onStatusChange: (newStatus: Status) => void;

    dueDate?: Date;
    onDueDateChange: (newDate: Date | null) => void;

    assignees?: Person[];
    onAssigneesChange: (newAssignees: Person[]) => void;

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

    // Search functionality for rich editor mentions
    peopleSearch?: SearchFn;

    // Person lookup for rich content mentions
    mentionedPersonLookup: MentionedPersonLookupFn;

    // Permissions
    canEdit: boolean;

    // Activity/Comments placeholder
    activityFeed?: React.ReactNode;
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

  return (
    <PageNew title={[state.name]} options={pageOptions(state)} size="fullwidth">
      <div className="px-4 py-4">
        <PageHeader {...state} />
        <div className="flex-1 overflow-scroll">
          <div className="px-4 py-6 max-w-6xl mx-auto">
            <div className="sm:grid sm:grid-cols-12">
              <Overview {...state} />
              <Sidebar {...state} />
            </div>
          </div>
        </div>
      </div>
    </PageNew>
  );
}
