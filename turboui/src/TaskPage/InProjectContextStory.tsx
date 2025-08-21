import React, { useState } from "react";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import { PageNew } from "../Page";
import { PageHeader } from "../ProjectPageLayout/PageHeader";
import { Tabs, useTabs } from "../Tabs";
import * as TaskBoardTypes from "../TaskBoard/types";
import { IconClipboardText, IconListCheck, IconLogs, IconMessages } from "../icons";
import { genPeople, searchPeopleFn } from "../utils/storybook/genPeople";
import { parentGoalSearchFn } from "../utils/storybook/parentGoalSearchFn";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";
import { TaskPage } from "./index";
import {
  asRichText,
  createActiveTaskTimeline,
  mockMentionedPersonLookup,
  mockMilestones,
  mockTaskPeople,
  searchMilestones,
  searchRichEditorPeople,
  searchTaskPeople,
  timelinePeople,
} from "./mockData";

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
  const [taskAssignee, setTaskAssignee] = useState<TaskPage.Person | null>(mockTaskPeople[1]!);
  const [taskMilestone, setTaskMilestone] = useState<TaskPage.Milestone | null>(mockMilestones[1]!); // Beta Release
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [space, setSpace] = useState({ id: "1", name: "Product", link: "#" });
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Mock project state for header
  const mockProjectState = {
    workmapLink: "#",
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
    updateProjectName: async () => true,
    updateDescription: async () => true,
    activityFeed: <div>Activity feed content</div>,
    tasks: [],
    milestones: [],
    onTaskStatusChange: () => {},
    onTaskCreate: () => {},
    onMilestoneCreate: () => {},
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
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
    manageTeamLink: "#",
    pauseLink: "#",

    resources: [],
    onResourceAdd: () => {},
    onResourceEdit: () => {},
    onResourceRemove: () => {},

    canDelete: true,
    onProjectDelete: () => {},
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
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
              projectName="Mobile App V2"
              workmapLink="#"
              space={{
                id: "space-123",
                name: "Product",
                link: "#"
              }}
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
              assignee={taskAssignee}
              onAssigneeChange={(newAssignee) => {
                setTaskAssignee(newAssignee);
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
              closedAt={null}
              updateProjectName={async (name: string) => {
                console.log("Updating project name:", name);
                return true;
              }}
              // Subscription
              isSubscribed={isSubscribed}
              onSubscriptionToggle={(subscribed) => {
                console.log("Toggling subscription:", subscribed);
                setIsSubscribed(subscribed);
              }}
              // Actions
              onDelete={async () => console.log("Task deleted")}
              onDuplicate={() => console.log("Task duplicated")}
              onArchive={() => console.log("Task archived")}
              // Search functionality
              searchPeople={searchTaskPeople}
              searchMilestones={searchMilestones}
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
