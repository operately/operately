import React, { useState } from "react";
import { TaskPage } from "./index";
import { genPeople, searchPeopleFn } from "../utils/storybook/genPeople";
import * as TaskBoardTypes from "../TaskBoard/types";
import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { PageHeader } from "../ProjectPage/PageHeader";
import { IconClipboardText, IconLogs, IconMessages, IconListCheck } from "../icons";
import {
  mockTaskPeople,
  mockMilestones,
  timelinePeople,
  searchTaskPeople,
  searchMilestones,
  searchRichEditorPeople,
  mockMentionedPersonLookup,
  asRichText,
  createActiveTaskTimeline,
} from "./mockData";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import { parentGoalSearchFn } from "../utils/storybook/parentGoalSearchFn";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";

const people = genPeople(5);

/**
 * TaskPage shown within a project context - demonstrates how a task detail view would appear
 * when navigated to from within a project's Tasks tab (like clicking a task from a task list)
 */
export function InProjectContextStory() {
  const [taskName, setTaskName] = useState("Implement user authentication flow");
  const [taskDescription, setTaskDescription] = useState(
    asRichText(
      "We need to implement a complete user authentication flow for the mobile app including login, social auth, and password reset functionality.",
    ),
  );
  const [taskStatus, setTaskStatus] = useState<TaskBoardTypes.Status>("in_progress");
  const [taskDueDate, setTaskDueDate] = useState<DateField.ContextualDate | undefined>(
    createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"),
  );
  const [taskAssignees, setTaskAssignees] = useState<TaskPage.Person[]>([mockTaskPeople[1]!]);
  const [taskMilestone, setTaskMilestone] = useState<TaskPage.Milestone | null>(mockMilestones[1]!); // Beta Release
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [space, setSpace] = useState({ id: "1", name: "Product", link: "#" });
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Mock project state for header
  const mockProjectState = {
    closeLink: "#",
    reopenLink: "#",
    projectName: "Mobile App Redesign",
    description:
      "<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>",
    space,
    setSpace,
    spaceSearch: spaceSearchFn,
    champion: people[0] || null,
    setChampion: () => {},
    status: "on_track" as const,
    state: "active" as const,
    closedAt: null,
    canEdit: true,
    accessLevels: { company: "edit" as const, space: "view" as const },
    setAccessLevels: () => {},
    updateProjectName: async () => true,
    updateDescription: async () => true,
    activityFeed: <div>Activity feed content</div>,
    tasks: [],
    milestones: [],
    onTaskStatusChange: () => {},
    onTaskCreate: () => {},
    onMilestoneCreate: () => {},
    onTaskUpdate: () => {},
    onMilestoneUpdate: () => {},
    searchPeople: searchTaskPeople,
    filters: [],
    onFiltersChange: () => {},
    championSearch: searchPeopleFn,
    reviewerSearch: searchPeopleFn,
    setParentGoal: () => {},
    parentGoal: null,
    parentGoalSearch: parentGoalSearchFn,
    contributors: [],
    isMoveModalOpen,
    newCheckInLink: "#",
    checkIns: [],
    newDiscussionLink: "#",
    discussions: [],
    mentionedPersonLookup: mockMentionedPersonLookup,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),

    resources: [],
    onResourceAdd: () => {},
    onResourceEdit: () => {},
    onResourceRemove: () => {},
  };

  // Show TaskPage within the Tasks tab - simulates navigating to a specific task
  const tabs = useTabs("tasks", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    {
      id: "tasks",
      label: "Tasks",
      icon: <IconListCheck size={14} />,
      count: 12,
    },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[mockProjectState.projectName]} size="fullwidth" testId="project-page">
      <PageHeader {...mockProjectState} />
      <Tabs tabs={tabs} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {tabs.active === "overview" && <div className="flex-1 overflow-auto p-4">Overview content will go here</div>}
        {tabs.active === "tasks" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <TaskPage
              // Navigation
              spaceLink="/spaces/product"
              spaceName="Product"
              projectLink="/projects/mobile-app"
              projectName="Mobile App V2"
              milestoneLink={taskMilestone ? "/milestones/beta-release" : undefined}
              milestoneName={taskMilestone ? "Beta Release" : undefined}
              // Core task data
              name={taskName}
              onNameChange={async (newName: string) => {
                console.log("Updating task name:", newName);
                setTaskName(newName);
                return true;
              }}
              description={taskDescription}
              onDescriptionChange={async (newDescription: any) => {
                console.log("Updating task description:", newDescription);
                setTaskDescription(newDescription);
                return true;
              }}
              status={taskStatus}
              onStatusChange={(newStatus) => {
                console.log("Updating task status:", newStatus);
                setTaskStatus(newStatus);
              }}
              dueDate={taskDueDate}
              onDueDateChange={(newDate) => {
                console.log("Updating due date:", newDate);
                setTaskDueDate(newDate ?? undefined);
              }}
              assignees={taskAssignees}
              onAssigneesChange={(newAssignees) => {
                console.log("Updating assignees:", newAssignees);
                setTaskAssignees(newAssignees);
              }}
              // Milestone
              milestone={taskMilestone}
              onMilestoneChange={(newMilestone) => {
                console.log("Updating milestone:", newMilestone);
                setTaskMilestone(newMilestone);
              }}
              // Metadata
              createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // One week ago
              createdBy={mockTaskPeople[0]!}
              // Subscription
              isSubscribed={isSubscribed}
              onSubscriptionToggle={(subscribed) => {
                console.log("Toggling subscription:", subscribed);
                setIsSubscribed(subscribed);
              }}
              // Actions
              onCopyUrl={() => console.log("URL copied")}
              onDelete={async () => console.log("Task deleted")}
              onDuplicate={() => console.log("Task duplicated")}
              onArchive={() => console.log("Task archived")}
              // Search functionality
              searchPeople={searchTaskPeople}
              searchMilestones={searchMilestones}
              onCreateMilestone={(title?: string) => {
                console.log("Creating new milestone with title:", title);
                if (title) {
                  const newMilestone: TaskPage.Milestone = {
                    id: `milestone-${Date.now()}`,
                    title: title,
                    status: "pending",
                    projectLink: "/projects/demo",
                  };
                  setTaskMilestone(newMilestone);
                }
              }}
              peopleSearch={searchRichEditorPeople}
              mentionedPersonLookup={mockMentionedPersonLookup}
              // Permissions
              canEdit={true}
              // Timeline data
              timelineItems={createActiveTaskTimeline()}
              currentUser={timelinePeople[0]!}
              canComment={true}
              onAddComment={(content: any) => console.log("Add comment:", content)}
              onEditComment={(id: string, content: any) => console.log("Edit comment:", id, content)}
            />
          </div>
        )}
        {tabs.active === "discussions" && (
          <div className="flex-1 overflow-auto p-4">Discussions content will go here</div>
        )}
        {tabs.active === "activity" && <div className="flex-1 overflow-auto p-4">Activity content will go here</div>}
      </div>
    </PageNew>
  );
}
