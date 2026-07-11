import React from "react";

import { ProjectPageLayout } from "../ProjectPageLayout";

import { PageDocsAndFilesTab, type PageDocsAndFiles } from "../DocsAndFiles/PageDocsAndFiles";
import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";

import { DateField } from "../DateField";
import { MoveModal } from "../Modal/MoveModal";
import { BadgeStatus } from "../StatusBadge/types";
import { PersonField } from "../PersonField";
import { PrivacyField } from "../PrivacyField";
import { useTabs } from "../Tabs";
import * as TaskBoardTypes from "../TaskBoard/types";
import type { KanbanBoardProps, KanbanState } from "../TaskBoard/KanbanView/types";
import { CheckIns } from "./CheckIns";
import { DeleteModal } from "./DeleteModal";
import { Discussions } from "./Discussions";
import { Overview } from "./Overview";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { SidebarNotificationSection } from "../SidebarSection";
import { TasksSection } from "./TasksSection";
import { getTaskCompletionStats } from "./taskCompletion";
import { ProjectPermissions } from "./types";
import type { FormattedTimePreferences } from "../FormattedTime";

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
    state?: "draft" | "scheduled" | "published" | null;
  }

  export interface Discussion {
    id: string;
    title: string;
    author: Person | null;
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
  export type Task = TaskBoardTypes.Task;

  export type NewMilestonePayload = TaskBoardTypes.NewMilestonePayload;
  export type UpdateMilestonePayload = TaskBoardTypes.UpdateMilestonePayload;
  export type NewTaskPayload = TaskBoardTypes.NewTaskPayload;
  export type TaskStatus = TaskBoardTypes.StatusCustomizationStatus;

  export type SpaceProps =
    | {
        workmapLink: string;
        space: Space;
        setSpace: (space: Space) => void;
        spaceSearch: (params: { query: string }) => Promise<Space[]>;

        setChampion: (person: Person | null) => void;
        championSearch: PersonField.SearchData;

        setReviewer?: (person: Person | null) => void;
        reviewerSearch: PersonField.SearchData;
      }
    | {
        homeLink: string;
      };

  export type DocsAndFiles = PageDocsAndFiles;

  interface CommonProps {
    closeLink: string;
    reopenLink: string;
    pauseLink: string;
    exportMarkdown?: () => void;

    project: {
      id: string;
      name: string;
    };
    newCheckInLink: string;
    newDiscussionLink: string;
    nextCheckInScheduledAt?: Date | null;

    childrenCount: ProjectPageLayout.ChildrenCount;
    permissions: ProjectPermissions;

    champion: Person | null;
    reviewer?: Person | null;

    parentGoal: ParentGoal | null;
    setParentGoal: (goal: ParentGoal | null) => void;
    parentGoalSearch: (params: { query: string }) => Promise<ParentGoal[]>;

    startedAt?: DateField.ContextualDate | null;
    setStartedAt?: (date: DateField.ContextualDate | null) => void;
    dueAt?: DateField.ContextualDate | null;
    setDueAt?: (date: DateField.ContextualDate | null) => void;

    status: BadgeStatus;
    state?: "active" | "closed" | "paused";

    closedAt: Date | null;
    retrospectiveLink?: string;

    manageTeamLink: string;
    manageAccessLink?: string;

    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;

    updateProjectName: (name: string) => Promise<boolean>;

    description: string;
    onDescriptionChange: (description: string | null) => Promise<boolean>;

    activityFeed: React.ReactNode;

    onProjectDelete: () => void;

    // TaskBoard props
    tasks: TaskBoardTypes.Task[];
    milestones: Milestone[];
    searchableMilestones: Milestone[]; // Filtered milestones for task creation
    showMilestoneKanbanLink?: boolean;

    // Kanban props
    kanbanState: KanbanState;
    onTaskKanbanChange: KanbanBoardProps["onTaskKanbanChange"];

    onTaskCreate: (task: NewTaskPayload) => void;
    onTaskNameChange: (taskId: string, name: string) => void;
    onTaskAssigneeChange: (taskId: string, assignees: TaskBoardTypes.Person[]) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskRemindersChange?: TaskBoardTypes.TaskBoardProps["onTaskRemindersChange"];
    onTaskStatusChange: (taskId: string, status: TaskBoardTypes.Status | null) => void;
    onTaskMilestoneChange?: (taskId: string, milestoneId: string | null, index: number) => void;
    onTaskDelete: (taskId: string) => void | Promise<{ success: boolean }>;
    onMilestoneCreate: (milestone: NewMilestonePayload) => void | Promise<{ success: boolean }>;
    onMilestoneUpdate: (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => void;
    onMilestoneReorder: (sourceId: string, destinationIndex: number) => Promise<void>;
    onMilestoneSearch: (query: string) => Promise<void>;
    assigneePersonSearch: PersonField.SearchData;
    filters?: TaskBoardTypes.FilterCondition[];
    onFiltersChange?: (filters: TaskBoardTypes.FilterCondition[]) => void;

    statuses: TaskBoardTypes.Status[];
    onSaveCustomStatuses: (data: {
      nextStatuses: TaskBoardTypes.Status[];
      deletedStatusReplacements: Record<string, string>;
    }) => void;

    contributors: Person[];
    checkIns: CheckIn[];
    discussions: Discussion[];

    currentUser?: Person | null;

    richTextHandlers: RichEditorHandlers;
    localDraftKeyBase?: string;

    onTaskDescriptionChange: (taskId: string, description: any) => Promise<boolean>;
    getTaskPageProps: KanbanBoardProps["getTaskPageProps"];

    moveModalOpen?: boolean;
    subscriptions: SidebarNotificationSection.Props;
    docsAndFiles?: DocsAndFiles;
    formattedTimePreferences: FormattedTimePreferences;
  }

  export type Props = CommonProps & SpaceProps;

  export type State = Props & {
    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;

    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  };
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
  const taskCompletion = React.useMemo(() => getTaskCompletionStats(state.tasks), [state.tasks]);

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
    {
      id: "docs-and-files",
      label: "Docs & Files",
      icon: <IconClipboardText size={14} />,
      hidden: !state.docsAndFiles,
    },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);
  const activeTab = !state.docsAndFiles && tabs.active === "docs-and-files" ? "overview" : tabs.active;

  return (
    <ProjectPageLayout
      title={[state.project.name]}
      projectName={state.project.name}
      taskCompletion={taskCompletion}
      testId="project-page"
      tabs={tabs}
      {...state}
    >
      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && <Overview {...state} />}
        {activeTab === "tasks" && <TasksSection state={state} />}
        {activeTab === "check-ins" && <CheckIns {...state} />}
        {activeTab === "discussions" && <Discussions {...state} />}
        {activeTab === "docs-and-files" && state.docsAndFiles && <PageDocsAndFilesTab docsAndFiles={state.docsAndFiles} />}
        {activeTab === "activity" && <Activity {...state} />}
      </div>

      {"space" in state && <MoveModal {...state} />}
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
