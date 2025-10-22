import React from "react";

import { ProjectPageLayout } from "../ProjectPageLayout";

import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";

import { DateField } from "../DateField";
import { MoveModal } from "../Modal/MoveModal";
import { ResourceManager } from "../ResourceManager";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { BadgeStatus } from "../StatusBadge/types";
import { PersonField } from "../PersonField";
import { useTabs } from "../Tabs";
import { TaskBoard } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";
import { CheckIns } from "./CheckIns";
import { DeleteModal } from "./DeleteModal";
import { Discussions } from "./Discussions";
import { Overview } from "./Overview";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { SidebarNotificationSection } from "../SidebarSection";

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

  export interface Discussion {
    id: string;
    title: string;
    author: Person;
    date: Date;
    link: string;
    content: string;
    commentCount: number;
  }

  export interface ParentGoal {
    id: string;
    name: string;
    link: string;
  }

  export type Milestone = TaskBoardTypes.Milestone;
  export type Resource = ResourceManager.Resource;
  export type Task = TaskBoardTypes.Task;

  export type NewMilestonePayload = TaskBoardTypes.NewMilestonePayload;
  export type UpdateMilestonePayload = TaskBoardTypes.UpdateMilestonePayload;
  export type NewResourcePayload = ResourceManager.NewResourcePayload;
  export type UpdateResourcePayload = ResourceManager.Resource;
  export type NewTaskPayload = TaskBoardTypes.NewTaskPayload;

  export interface Props {
    workmapLink: string;
    closeLink: string;
    reopenLink: string;
    pauseLink: string;
    exportMarkdown?: () => void;

    projectName: string;
    newCheckInLink: string;
    newDiscussionLink: string;

    childrenCount: ProjectPageLayout.ChildrenCount;

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
    manageTeamLink: string;

    updateProjectName: (name: string) => Promise<boolean>;

    description: string;
    onDescriptionChange: (description: string | null) => Promise<boolean>;

    activityFeed: React.ReactNode;

    canDelete: boolean;
    onProjectDelete: () => void;

    // TaskBoard props
    tasks: TaskBoardTypes.Task[];
    milestones: Milestone[];
    searchableMilestones: Milestone[]; // Filtered milestones for task creation
    onTaskCreate: (task: NewTaskPayload) => void;
    onTaskAssigneeChange: (taskId: string, assignee: TaskBoardTypes.Person | null) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange: (taskId: string, status: string) => void;
    onTaskMilestoneChange?: (taskId: string, milestoneId: string, index: number) => void;
    onMilestoneCreate: (milestone: NewMilestonePayload) => void;
    onMilestoneUpdate: (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => void;
    onMilestoneReorder: (sourceId: string, destinationIndex: number) => Promise<void>;
    onMilestoneSearch: (query: string) => Promise<void>;
    assigneePersonSearch: PersonField.SearchData;
    filters?: TaskBoardTypes.FilterCondition[];
    onFiltersChange?: (filters: TaskBoardTypes.FilterCondition[]) => void;

    contributors: Person[];
    checkIns: CheckIn[];
    discussions: Discussion[];

    currentUser?: Person | null;

    richTextHandlers: RichEditorHandlers;

    // Resource management
    resources: ResourceManager.Resource[];
    onResourceAdd: (resource: NewResourcePayload) => void;
    onResourceEdit: (resource: ResourceManager.Resource) => void;
    onResourceRemove: (id: string) => void;

    moveModalOpen?: boolean;
    subscriptions: SidebarNotificationSection.Props;
  }

  export interface State extends Props {
    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;

    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  }
}

function useProjectPageState(props: ProjectPage.Props): ProjectPage.State {
  const [isMoveModalOpen, setIsMoveModalOpen] = React.useState(props.moveModalOpen || false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  return {
    ...props,

    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),

    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
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
      count: state.childrenCount.tasksCount,
    },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} />, count: state.childrenCount.checkInsCount },
    {
      id: "discussions",
      label: "Discussions",
      icon: <IconMessages size={14} />,
      count: state.childrenCount.discussionsCount,
    },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <ProjectPageLayout title={[state.projectName]} testId="project-page" tabs={tabs} {...state}>
      <div className="flex-1 overflow-auto">
        {tabs.active === "overview" && <Overview {...state} />}
        {tabs.active === "tasks" && (
          <div className="flex-1 flex flex-col overflow-hidden pt-1">
            <TaskBoard
              tasks={state.tasks}
              milestones={state.milestones}
              searchableMilestones={state.searchableMilestones}
              onTaskCreate={state.onTaskCreate}
              onMilestoneCreate={state.onMilestoneCreate}
              onTaskAssigneeChange={state.onTaskAssigneeChange}
              onTaskDueDateChange={state.onTaskDueDateChange}
              onTaskStatusChange={state.onTaskStatusChange}
              onTaskMilestoneChange={state.onTaskMilestoneChange}
              onMilestoneUpdate={state.onMilestoneUpdate}
              onMilestoneSearch={state.onMilestoneSearch}
              assigneePersonSearch={state.assigneePersonSearch}
              filters={state.filters}
              onFiltersChange={state.onFiltersChange}
            />
          </div>
        )}
        {tabs.active === "check-ins" && <CheckIns {...state} />}
        {tabs.active === "discussions" && <Discussions {...state} />}
        {tabs.active === "activity" && <Activity {...state} />}
      </div>

      <MoveModal {...state} />
      <DeleteModal {...state} />
    </ProjectPageLayout>
  );
}

function Activity(props: ProjectPage.State) {
  return (
    <div className="p-4 max-w-6xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">Activity</div>
      {props.activityFeed}
    </div>
  );
}
