import React from "react";

import { ProjectPageLayout } from "../ProjectPageLayout";
import { useProjectPageTabs } from "../ProjectPageLayout/useProjectPageTabs";

import { PageDocsAndFilesTab, type PageDocsAndFiles } from "../DocsAndFiles/PageDocsAndFiles";

import { DateField } from "../DateField";
import { MoveModal } from "../Modal/MoveModal";
import { BadgeStatus } from "../StatusBadge/types";
import { PersonField } from "../PersonField";
import { PrivacyField } from "../PrivacyField";
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
import { SaveProjectAsTemplateModal } from "../SaveProjectAsTemplateModal";
import type { Contributor as ContributorsSectionContributor, ContributorFormValues } from "../ContributorsSection";
import type { OtherPeopleWithAccessPerson } from "../OtherPeopleWithAccess";

export namespace ProjectPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type Person = PersonField.Person;
  export type Contributor = ContributorsSectionContributor;

  export interface CheckIn {
    id: string;
    author: Person;
    date: Date;
    content: string;
    link: string;
    commentCount: number;
    status: BadgeStatus;
    state?: "draft" | "scheduled" | "published" | null;
    scheduledAt?: string | null;
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

  export interface MilestoneCreationResult {
    success: boolean;
    milestone?: Milestone;
  }

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

    otherPeopleWithAccess: {
      people: OtherPeopleWithAccessPerson[] | undefined;
      loading: boolean;
      onRequestLoad: () => void;
    };

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
    onMilestoneCreate: (
      milestone: NewMilestonePayload,
    ) => void | MilestoneCreationResult | Promise<MilestoneCreationResult>;
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

    tasksView: TaskBoardTypes.TaskDisplayMode;
    onTasksViewChange: (mode: TaskBoardTypes.TaskDisplayMode) => void | Promise<void>;

    contributors: Contributor[];
    canEditContributors?: boolean;
    contributorPersonSearch?: PersonField.SearchData;
    onContributorCreate?: (values: ContributorFormValues) => void | boolean | Promise<void | boolean>;
    onContributorUpdate?: (
      contributorId: string,
      updates: Partial<ContributorFormValues>,
    ) => void | boolean | Promise<void | boolean>;
    onContributorDelete?: (contributorId: string) => void | Promise<void>;

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
    saveAsTemplate?: {
      canSave: boolean;
      submissionEnabled: boolean;
      onSave: (values: SaveProjectAsTemplateModal.Values) => Promise<SaveProjectAsTemplateModal.Result>;
      onSuccess?: () => void;
    };
  }

  export type Props = CommonProps & SpaceProps;

  export type State = Props & {
    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;

    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;

    isSaveAsTemplateModalOpen?: boolean;
    openSaveAsTemplateModal?: () => void;
    closeSaveAsTemplateModal?: () => void;
  };
}

function useProjectPageState(props: ProjectPage.Props): ProjectPage.State {
  const [isMoveModalOpen, setIsMoveModalOpen] = React.useState(props.moveModalOpen || false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = React.useState(false);

  return {
    ...props,

    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),

    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),

    isSaveAsTemplateModalOpen,
    openSaveAsTemplateModal: () => setIsSaveAsTemplateModalOpen(true),
    closeSaveAsTemplateModal: () => setIsSaveAsTemplateModalOpen(false),
  };
}

export function ProjectPage(props: ProjectPage.Props) {
  const state = useProjectPageState(props);
  const taskCompletion = React.useMemo(() => getTaskCompletionStats(state.tasks), [state.tasks]);

  const tabs = useProjectPageTabs({
    defaultTab: "overview",
    childrenCount: state.childrenCount,
    showDocsAndFiles: Boolean(state.docsAndFiles),
  });
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
        {activeTab === "docs-and-files" && state.docsAndFiles && (
          <PageDocsAndFilesTab
            docsAndFiles={state.docsAndFiles}
            formattedTimePreferences={state.formattedTimePreferences}
          />
        )}
        {activeTab === "activity" && <Activity {...state} />}
      </div>

      {"space" in state && <MoveModal {...state} />}
      <DeleteModal {...state} />
      {state.saveAsTemplate && (
        <SaveProjectAsTemplateModal
          isOpen={Boolean(state.isSaveAsTemplateModalOpen)}
          onClose={state.closeSaveAsTemplateModal ?? (() => undefined)}
          projectName={state.project.name}
          projectDescription={state.description}
          richTextHandlers={state.richTextHandlers}
          formattedTimePreferences={state.formattedTimePreferences}
          submissionEnabled={state.saveAsTemplate.submissionEnabled}
          onSave={state.saveAsTemplate.onSave}
          onSuccess={state.saveAsTemplate.onSuccess}
        />
      )}
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
