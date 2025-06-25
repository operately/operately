import React, { useState } from "react";
import { TaskPage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";
import * as TaskBoardTypes from "../TaskBoard/types";
import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { PageHeader } from "../ProjectPage/PageHeader";
import { IconClipboardText, IconLogs, IconMessages, IconListCheck } from "../icons";
import { TaskActivity } from "../Timeline";
import type { TimelineItem as TimelineItemType } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";

const people = genPeople(5);

// Timeline people (with profile links)
const timelinePeople: TimelinePerson[] = [
  {
    id: "user-1",
    fullName: "Alice Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    profileLink: "/people/alice",
  },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob", profileLink: "/people/bob" },
  {
    id: "user-3",
    fullName: "Charlie Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=charlie",
    profileLink: "/people/charlie",
  },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: undefined, profileLink: "/people/diana" },
];

// Convert timeline people to TaskPage.Person format
const mockTaskPeople: TaskPage.Person[] = timelinePeople.map((p) => ({
  id: p.id,
  fullName: p.fullName,
  avatarUrl: p.avatarUrl || null,
}));

// Mock milestone data for TaskPage
const mockTaskMilestones: TaskPage.Milestone[] = [
  {
    id: "milestone-1",
    title: "Beta Release",
    dueDate: new Date(2024, 1, 15), // February 15, 2024
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/beta",
  },
  {
    id: "milestone-2",
    title: "MVP Launch",
    dueDate: new Date(2024, 0, 30), // January 30, 2024
    status: "complete",
    projectLink: "/projects/mobile-app/milestones/mvp",
  },
];

// Mock search functions
const searchTaskPeople = async ({ query }: { query: string }): Promise<TaskPage.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockTaskPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

const searchMilestones = async ({ query }: { query: string }): Promise<TaskPage.Milestone[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockTaskMilestones.filter((milestone) => milestone.title.toLowerCase().includes(query.toLowerCase()));
};

// Rich editor people need a title field and proper types
const richEditorPeople = timelinePeople.map((p) => ({
  ...p,
  title: "Team Member",
  avatarUrl: p.avatarUrl || null,
  profileLink: p.profileLink || "",
}));

const searchRichEditorPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return richEditorPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

const mockMentionedPersonLookup = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return richEditorPeople.find((person) => person.id === id) || null;
};

// Helper function to convert text to rich content JSON format
function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}

// Helper functions for creating timeline data
function createComment(author: TimelinePerson, content: string, timeAgo: number): TimelineItemType {
  return {
    type: "comment",
    value: {
      id: `comment-${Date.now()}-${Math.random()}`,
      content: JSON.stringify({ message: content }),
      author,
      insertedAt: new Date(Date.now() - timeAgo).toISOString(),
      reactions: [],
    },
  };
}

function createTaskActivity(
  type: TaskActivity["type"],
  author: TimelinePerson,
  timeAgo: number,
  extraData: any = {},
): TimelineItemType {
  return {
    type: "task-activity",
    value: {
      id: `activity-${Date.now()}-${Math.random()}`,
      type,
      author,
      insertedAt: new Date(Date.now() - timeAgo).toISOString(),
      ...extraData,
    } as TaskActivity,
  };
}

// Mock timeline for the task
const createTaskTimeline = (): TimelineItemType[] => [
  createComment(
    timelinePeople[1]!,
    "I've started working on the login component. Should have a first version ready by tomorrow.",
    30 * 60 * 1000,
  ), // 30 min ago
  createTaskActivity("task-status-change", timelinePeople[0]!, 2 * 60 * 60 * 1000, {
    fromStatus: "not_started",
    toStatus: "in_progress",
  }), // 2 hours ago
  createTaskActivity("task-assignment", timelinePeople[0]!, 3 * 60 * 60 * 1000, {
    assignee: timelinePeople[1]!,
    action: "assigned",
  }), // 3 hours ago
  createTaskActivity("task-milestone", timelinePeople[0]!, 4 * 60 * 60 * 1000, {
    milestone: { id: "milestone-1", title: "Beta Release", status: "pending" },
    action: "attached",
  }),
  createComment(
    timelinePeople[0]!,
    "This is a critical feature for the beta release. Let's prioritize it.",
    6.5 * 60 * 60 * 1000,
  ),
  createTaskActivity("task-creation", timelinePeople[0]!, 24 * 60 * 60 * 1000), // 1 day ago
];

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
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [taskAssignees, setTaskAssignees] = useState<TaskPage.Person[]>([mockTaskPeople[1]!]);
  const [taskMilestone, setTaskMilestone] = useState<TaskPage.Milestone | null>(mockTaskMilestones[0]!);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Mock project state for header
  const mockProjectState = {
    closeLink: "#",
    reopenLink: "#",
    projectName: "Mobile App Redesign",
    description:
      "<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>",
    space: { id: "1", name: "Product", link: "#" },
    setSpace: () => {},
    spaceSearch: async () => [],
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
              timelineItems={createTaskTimeline()}
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
