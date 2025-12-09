import React, { useState } from "react";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { TaskPage } from "./index";
import {
  asRichText,
  createActiveTaskTimeline,
  mockMilestones,
  mockTaskPeople,
  timelinePeople,
} from "./mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import { StatusSelector } from "../StatusSelector";

const DEFAULT_STATUS_OPTIONS: StatusSelector.StatusOption[] = [
  { id: "pending", value: "pending", label: "Not started", color: "gray", icon: "circleDashed", index: 0 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "review", value: "review", label: "In review", color: "blue", icon: "circleDot", index: 2 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 3 },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 4 },
];

/**
 * TaskPage shown within a project context - demonstrates how a task detail view would appear
 * when navigated to from within a project's Tasks tab (like clicking a task from a task list)
 */
export function InProjectContextStory() {
  const assigneePersonSearch = usePersonFieldSearch(mockTaskPeople);

  const [taskName, setTaskName] = useState("Implement user authentication flow");
  const [taskDescription, setTaskDescription] = useState(
    asRichText(
      "We need to implement a complete user authentication flow for the mobile app including login, social auth, and password reset functionality.",
    ),
  );
  const [taskStatus, setTaskStatus] = useState<TaskBoardTypes.Status | null>(DEFAULT_STATUS_OPTIONS[1] ?? null);
  const [taskDueDate, setTaskDueDate] = useState<DateField.ContextualDate | undefined>(
    createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"),
  );
  const [taskAssignee, setTaskAssignee] = useState<TaskPage.Person | null>(mockTaskPeople[1]!);
  const [taskMilestone, setTaskMilestone] = useState<TaskPage.Milestone | null>(mockMilestones[1]!); // Beta Release
  const [milestones, setMilestones] = useState<TaskPage.Milestone[]>(mockMilestones);
  const subscriptions = useMockSubscriptions({ entityType: "project_task", initial: false });

  const handleMilestoneSearch = async (query: string) => {
    const filtered = mockMilestones.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
    setMilestones(filtered);
  };

  return (
    <TaskPage
      // Navigation
      projectName="Mobile App V2"
      projectStatus="on_track"
      projectLink="#"
      workmapLink="#"
      childrenCount={{
        tasksCount: 8,
        discussionsCount: 3,
        checkInsCount: 2,
      }}
      space={{
        id: "space-123",
        name: "Product",
        link: "#",
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
      subscriptions={subscriptions}
      // Actions
      onDelete={async () => console.log("Task deleted")}
      onDuplicate={() => console.log("Task duplicated")}
      onArchive={() => console.log("Task archived")}
      // Search functionality
      assigneePersonSearch={assigneePersonSearch}
      milestones={milestones}
      onMilestoneSearch={handleMilestoneSearch}
      richTextHandlers={createMockRichEditorHandlers()}
      statusOptions={DEFAULT_STATUS_OPTIONS}
      // Permissions
      canEdit={true}
      // Timeline data
      timelineItems={createActiveTaskTimeline()}
      currentUser={timelinePeople[0]!}
      canComment={true}
      onAddComment={(content: any) => console.log("Add comment:", content)}
      onEditComment={(id: string, content: any) => console.log("Edit comment:", id, content)}
      onDeleteComment={(id: string) => console.log("Delete comment:", id)}
    />
  );
}
