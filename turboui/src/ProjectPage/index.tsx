import React from "react";

import { PageNew } from "../Page";

import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";

import { DateField } from "../DateField";
import { PrivacyField } from "../PrivacyField";
import { ResourceManager } from "../ResourceManager";
import { MentionedPersonLookupFn } from "../RichEditor";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { TaskBoard } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";
import { Overview } from "./Overview";
import { PageHeader } from "./PageHeader";
import { StatusBanner } from "./StatusBanner";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";

export namespace ProjectPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title: string;
    profileLink: string;
  }

  export interface CheckIn {
    id: string;
    author: Person;
    date: Date;
    content: string;
    link: string;
    commentCount: number;
    status: BadgeStatus;
  }

  export interface ParentGoal {
    id: string;
    name: string;
    link: string;
  }

  export type Milestone = TaskBoardTypes.Milestone;
  export type Resource = ResourceManager.Resource;

  export interface Props {
    closeLink: string;
    reopenLink: string;

    projectName: string;
    description?: string;

    space: Space;
    setSpace: (space: Space) => void;
    spaceSearch: (params: { query: string }) => Promise<Space[]>;

    champion: Person | null;
    setChampion: (person: Person | null) => void;
    championSearch: SearchFn;

    reviewer?: Person | null;
    setReviewer?: (person: Person | null) => void;
    reviewerSearch: SearchFn;

    parentGoal: ParentGoal | null;
    setParentGoal: (goal: ParentGoal | null) => void;
    parentGoalSearch: (params: { query: string }) => Promise<ParentGoal[]>;

    startedAt?: DateField.ContextualDate | null;
    setStartedAt?: (date: DateField.ContextualDate | null) => void;
    dueAt?: DateField.ContextualDate | null;
    setDueAt?: (date: DateField.ContextualDate | null) => void;

    status: BadgeStatus;
    state: "active" | "closed" | "paused";

    closedAt: Date | null;
    retrospectiveLink?: string;

    canEdit: boolean;
    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;

    updateProjectName: (name: string) => Promise<boolean>;
    updateDescription: (description: string | null) => Promise<boolean>;

    activityFeed: React.ReactNode;

    // TaskBoard props
    tasks: TaskBoardTypes.Task[];
    milestones?: Milestone[];
    onTaskStatusChange?: (taskId: string, newStatus: TaskBoardTypes.Status) => void;
    onTaskCreate?: (task: Omit<TaskBoardTypes.Task, "id">) => void;
    onMilestoneCreate?: (milestone: Omit<TaskBoardTypes.Milestone, "id">) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<TaskBoardTypes.Task>) => void;
    onMilestoneUpdate?: (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => void;
    searchPeople?: (params: { query: string }) => Promise<TaskBoardTypes.Person[]>;
    filters?: TaskBoardTypes.FilterCondition[];
    onFiltersChange?: (filters: TaskBoardTypes.FilterCondition[]) => void;

    contributors: Person[];
    manageTeamLink?: string;
    checkIns?: CheckIn[];
    mentionedPersonLookup?: MentionedPersonLookupFn;

    // Resource management
    resources?: ResourceManager.Resource[];
    onResourceAdd?: (resource: Omit<ResourceManager.Resource, "id">) => void;
    onResourceEdit?: (id: string, resource: Partial<ResourceManager.Resource>) => void;
    onResourceRemove?: (id: string) => void;
  }

  export interface State extends Props {}
}

function useProjectPageState(props: ProjectPage.Props): ProjectPage.State {
  return {
    ...props,
  };
}

export function ProjectPage(props: ProjectPage.Props) {
  const state = useProjectPageState(props);

  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    {
      id: "tasks",
      label: "Tasks",
      icon: <IconListCheck size={14} />,
      count: state.tasks.filter((task) => !task._isHelperTask).length,
    },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[state.projectName]} size="fullwidth" testId="project-page">
      <PageHeader {...state} />
      {(state.state === "paused" || state.state === "closed") && (
        <StatusBanner
          state={state.state}
          closedAt={state.closedAt}
          reopenLink={state.reopenLink}
          retrospectiveLink={state.retrospectiveLink}
        />
      )}
      <Tabs tabs={tabs} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {tabs.active === "overview" && <Overview {...state} />}
        {tabs.active === "tasks" && (
          <div className="flex-1 flex flex-col overflow-hidden pt-1">
            <TaskBoard
              tasks={state.tasks}
              milestones={state.milestones}
              onStatusChange={state.onTaskStatusChange}
              onTaskCreate={state.onTaskCreate}
              onMilestoneCreate={state.onMilestoneCreate}
              onTaskUpdate={state.onTaskUpdate}
              onMilestoneUpdate={state.onMilestoneUpdate}
              searchPeople={state.searchPeople}
              filters={state.filters}
              onFiltersChange={state.onFiltersChange}
            />
          </div>
        )}
        {tabs.active === "check-ins" && <div className="flex-1 overflow-auto p-4">Check-ins content will go here</div>}
        {tabs.active === "discussions" && (
          <div className="flex-1 overflow-auto p-4">Discussions content will go here</div>
        )}
        {tabs.active === "activity" && <div className="flex-1 overflow-auto p-4">Activity content will go here</div>}
      </div>
    </PageNew>
  );
}

export { StatusBanner };
