import * as React from "react";
import { useState } from "react";

import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import {
  createMockDocumentNode,
  createMockDraftNode,
  createMockFileNode,
  createMockFolderNode,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "../ResourceHubPage/mockData";
import { mockTasks } from "../TaskBoard/tests/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { useMockMilestoneOrdering } from "../utils/storybook/milestones";
import { generatePermissions } from "../utils/storybook/permissions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { asRichText } from "../utils/storybook/richContent";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import { useMockTaskBoardActions } from "../utils/storybook/tasks";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { PrivacyField } from "../PrivacyField";
import { ProjectPage } from "./index";

const defaultProjectAccessLevels: PrivacyField.AccessLevels = {
  company: "view",
  space: "view",
};

export interface ProjectPageWithDocsAndFilesStoryData {
  currentViewer: ProjectPage.Person;
  defaultSpace: ProjectPage.Space;
  defaultStatuses: TaskBoardTypes.Status[];
  mockCheckIns: ProjectPage.CheckIn[];
  mockContributors: ProjectPage.Person[];
  mockDiscussions: ProjectPage.Discussion[];
  mockPeople: TaskBoardTypes.Person[];
  parentGoalSearch: ({ query }: { query: string }) => Promise<ProjectPage.ParentGoal[]>;
  people: ProjectPage.Person[];
}

export function ProjectPageWithDocsAndFilesStory({
  storyData,
  includeDrafts = true,
}: {
  storyData: ProjectPageWithDocsAndFilesStoryData;
  includeDrafts?: boolean;
}) {
  const championSearch = usePersonFieldSearch(storyData.people);
  const reviewerSearch = usePersonFieldSearch(storyData.people);
  const [tasks, setTasks] = useState([...mockTasks("project")]);
  const initialMilestones: TaskBoardTypes.Milestone[] = [
    {
      id: "m1",
      name: "Kickoff Complete",
      dueDate: createContextualDate(daysAgo(7), "day"),
      hasDescription: true,
      hasComments: true,
      commentCount: 2,
      status: "done",
      link: "#",
      kanbanLink: "#",
    },
    {
      id: "m2",
      name: "Usability Test Round 1",
      dueDate: createContextualDate(addDays(new Date(), 7), "day"),
      hasDescription: true,
      hasComments: false,
      status: "pending",
      link: "#",
      kanbanLink: "#",
    },
    {
      id: "m3",
      name: "Beta Release",
      dueDate: createContextualDate(addDays(new Date(), 21), "day"),
      hasDescription: false,
      hasComments: false,
      status: "pending",
      link: "#",
      kanbanLink: "#",
    },
  ];
  const { milestones, setMilestones, reorderMilestones } = useMockMilestoneOrdering({ initialMilestones });
  const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
  const [statuses, setStatuses] = useState<TaskBoardTypes.Status[]>(storyData.defaultStatuses);
  const [parentGoal, setParentGoal] = useState<ProjectPage.ParentGoal | null>({
    id: "1",
    name: "Improve Customer Experience",
    link: "/goals/1",
  });
  const [reviewer, setReviewer] = useState<ProjectPage.Person | null>(storyData.people[2] || null);
  const [startedAt, setStartedAt] = useState<DateField.ContextualDate | null>(() =>
    createContextualDate(daysAgo(7), "day"),
  );
  const [dueAt, setDueAt] = useState<DateField.ContextualDate | null>(() =>
    createContextualDate(addDays(new Date(), 21), "day"),
  );
  const [space, setSpace] = useState(storyData.defaultSpace);
  const subscriptions = useMockSubscriptions({ entityType: "project" });
  const docsAndFiles = useMockProjectDocsAndFiles(
    { id: "project-1", name: "Mobile App Redesign" },
    { includeDrafts },
  );

  const handleMilestoneCreate = (newMilestoneData: ProjectPage.NewMilestonePayload) => {
    const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMilestone = { id: milestoneId, ...newMilestoneData };

    setMilestones((prev) => [...prev, newMilestone]);
  };

  const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
    );
    setMilestones(updatedMilestones);

    const updatedTasks = tasks.map((task) => {
      if (task.milestone?.id === milestoneId) {
        return {
          ...task,
          milestone: { ...task.milestone, ...updates },
        };
      }

      return task;
    });

    setTasks(updatedTasks);
  };

  const taskActions = useMockTaskBoardActions({
    tasks,
    setTasks,
    statuses,
    subscriptions,
  });

  return (
    <ProjectPage
      workmapLink="#"
      closeLink="#"
      reopenLink="#"
      pauseLink="#"
      showMilestoneKanbanLink={true}
      project={{ id: "project-1", name: "Mobile App Redesign" }}
      childrenCount={{
        tasksCount: tasks.length,
        discussionsCount: storyData.mockDiscussions.length,
        checkInsCount: storyData.mockCheckIns.length,
      }}
      description={
        asRichText(
          "Our current mobile app has inconsistent navigation and dated UI patterns, lowering engagement and hurting task completion on key flows. Let's ship an incremental redesign that improves time-to-task, increases activation on first session, and raises weekly retention for target cohorts. Success is measured by +15% task completion on onboarding and +10% weekly active users for the beta cohort.",
        ) as any
      }
      space={space}
      setSpace={setSpace}
      spaceSearch={spaceSearchFn}
      champion={storyData.people[4] || null}
      setChampion={() => {}}
      reviewer={reviewer}
      setReviewer={setReviewer}
      status="on_track"
      state="active"
      closedAt={null}
      permissions={generatePermissions(true)}
      updateProjectName={async () => true}
      onDescriptionChange={async () => true}
      activityFeed={<div>Activity feed content</div>}
      tasks={tasks}
      kanbanState={taskActions.kanbanState}
      onTaskKanbanChange={taskActions.onTaskKanbanChange}
      milestones={milestones}
      searchableMilestones={milestones}
      onMilestoneSearch={async () => {}}
      assigneePersonSearch={usePersonFieldSearch(storyData.mockPeople)}
      onTaskCreate={taskActions.onTaskCreate}
      onTaskNameChange={taskActions.onTaskNameChange}
      onMilestoneCreate={handleMilestoneCreate}
      onTaskAssigneeChange={taskActions.onTaskAssigneeChange}
      onTaskDueDateChange={taskActions.onTaskDueDateChange}
      onTaskStatusChange={taskActions.onTaskStatusChange}
      onTaskDelete={taskActions.onTaskDelete}
      onTaskDescriptionChange={taskActions.onTaskDescriptionChange}
      getTaskPageProps={taskActions.getTaskPageProps}
      onMilestoneUpdate={handleMilestoneUpdate}
      onMilestoneReorder={reorderMilestones}
      richTextHandlers={createMockRichEditorHandlers()}
      formattedTimePreferences={defaultFormattedTimePreferences}
      filters={filters}
      onFiltersChange={setFilters}
      statuses={statuses}
      onSaveCustomStatuses={(data) => {
        setStatuses(data.nextStatuses);
      }}
      parentGoal={parentGoal}
      setParentGoal={setParentGoal}
      parentGoalSearch={storyData.parentGoalSearch}
      startedAt={startedAt}
      setStartedAt={setStartedAt}
      dueAt={dueAt}
      setDueAt={setDueAt}
      contributors={storyData.mockContributors}
      accessLevels={defaultProjectAccessLevels}
      setAccessLevels={() => undefined}
      manageTeamLink="/projects/1/team"
      championSearch={championSearch}
      reviewerSearch={reviewerSearch}
      newCheckInLink="#"
      checkIns={storyData.mockCheckIns}
      newDiscussionLink="#"
      currentUser={storyData.currentViewer}
      discussions={storyData.mockDiscussions}
      onProjectDelete={() => {}}
      subscriptions={subscriptions}
      docsAndFiles={docsAndFiles}
    />
  );
}

function useMockProjectDocsAndFiles(
  project: { id: string; name: string },
  { includeDrafts = true }: { includeDrafts?: boolean } = {},
): ProjectPage.DocsAndFiles {
  const resourceHub = React.useMemo(
    () =>
      createMockResourceHub({
        id: "project-hub-1",
        name: "Documents & Files",
        project: { id: project.id, name: project.name } as never,
        space: undefined,
      }),
    [project.id, project.name],
  );

  const nodes = React.useMemo(
    () => [
      createMockFolderNode({
        id: "node-folder-templates",
        name: "Launch Assets",
        folder: {
          id: "folder-launch-assets",
          resourceHubId: resourceHub.id,
          resourceHub,
          pathToFolder: [],
        },
      }),
      createMockDocumentNode({
        id: "node-doc-brief",
        name: "Project Brief",
        updatedAt: "2026-06-13T12:00:00Z",
        document: {
          id: "document-project-brief",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
        },
      }),
      createMockFileNode({
        id: "node-file-roadmap",
        name: "Roadmap Snapshot",
        updatedAt: "2026-06-12T12:00:00Z",
        file: {
          id: "file-roadmap-snapshot",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
        },
      }),
      createMockFolderNode({
        id: "node-folder-research",
        name: "Research Notes",
        updatedAt: "2026-06-11T12:00:00Z",
        folder: {
          id: "folder-research-notes",
          resourceHubId: resourceHub.id,
          resourceHub,
          pathToFolder: [],
        },
      }),
      createMockDocumentNode({
        id: "node-doc-faq",
        name: "Referral rollout FAQ",
        updatedAt: "2026-06-10T12:00:00Z",
        document: {
          id: "document-referral-rollout-faq",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          commentsCount: 3,
        },
      }),
      createMockFileNode({
        id: "node-file-macros",
        name: "Support macros",
        updatedAt: "2026-06-09T12:00:00Z",
        file: {
          id: "file-support-macros",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          blob: {
            id: "blob-support-macros",
            url: "/support-macros.pdf",
            contentType: "application/pdf",
          } as any,
        },
      }),
      createMockDocumentNode({
        id: "node-doc-attribution",
        name: "Attribution dashboard notes",
        updatedAt: "2026-06-08T12:00:00Z",
        document: {
          id: "document-attribution-dashboard-notes",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          commentsCount: 1,
        },
      }),
    ],
    [resourceHub],
  );

  const draftNodes = React.useMemo(
    () =>
      includeDrafts
        ? [
            createMockDraftNode({
              id: "node-draft-launch-plan",
              name: "Launch Plan Draft",
              document: {
                id: "document-launch-plan-draft",
                resourceHubId: resourceHub.id,
                parentFolderId: undefined,
              },
            }),
          ]
        : [],
    [includeDrafts, resourceHub],
  );

  const sharedListProps = useMockSharedListPageProps({
    parent: resourceHub,
    parentType: "resource_hub",
    nodes,
  });

  return {
    resourceHub,
    previewNodes: nodes,
    tabPath: `/projects/${project.id}?tab=docs-and-files`,
    drafts: {
      nodes: draftNodes,
      draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
      getDraftEditPath: (node) => (node.document?.id ? `/resource-hub/documents/${node.document.id}/edit` : undefined),
    },
    newFileModals: sharedListProps.newFileModals,
    addFileWidgetProps: sharedListProps.addFileWidgetProps,
    nodesListProps: sharedListProps.nodesListProps,
    addFolderModalProps: sharedListProps.addFolderModalProps,
  };
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function daysAgo(days: number): Date {
  return addDays(new Date(), -days);
}
