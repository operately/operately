import React, { useState } from "react";
import { MilestonePage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";
import { mockTasks, mockMilestones } from "../TaskBoard/tests/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { PageHeader } from "../ProjectPage/PageHeader";
import { IconClipboardText, IconLogs, IconMessage, IconMessages, IconListCheck } from "../icons";

const people = genPeople(5);

// Mock people data for search
const mockPeople: TaskBoardTypes.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }): Promise<TaskBoardTypes.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Get a specific milestone from mock data and add status
const targetMilestone = { ...Object.values(mockMilestones)[0]!, status: "active" }; // Q2 Feature Release

// Create an empty milestone for the empty story
const emptyMilestone: TaskBoardTypes.Milestone & { status?: string } = {
  id: "milestone-empty-project",
  name: "Q3 Planning Phase",
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  hasDescription: false,
  hasComments: false,
  status: "active",
};

// Filter tasks for this milestone
const milestoneTasks = mockTasks.filter((task) => task.milestone?.id === targetMilestone.id);

// Mock timeline items for the stories
const createMockTimelineItems = () => [
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-1",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      content: "created the milestone",
      type: "milestone-created",
    },
  },
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-2",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      content: "added a description",
      type: "milestone-description-added",
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-3",
      type: "task-status-change" as const,
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      fromStatus: "pending" as const,
      toStatus: "done" as const,
      task: {
        id: "task-1",
        title: "Implement user authentication",
        status: "done" as const,
      },
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-4",
      type: "task-status-change" as const,
      author: mockPeople[2],
      insertedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      fromStatus: "pending" as const,
      toStatus: "done" as const,
      task: {
        id: "task-4",
        title: "Add support for dark mode",
        status: "done" as const,
      },
    },
  },
  {
    type: "comment" as const,
    value: {
      id: "comment-1",
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      content: JSON.stringify({
        message:
          "Just wanted to update everyone on the progress. We're making good headway on the authentication system.",
      }),
      reactions: [
        { id: "reaction-1", emoji: "👍", count: 2, reacted: false },
        { id: "reaction-2", emoji: "🎉", count: 1, reacted: true },
      ],
    },
  },
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-5",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      content: "Milestone status changed to In Progress",
      type: "milestone_update",
    },
  },
  {
    type: "comment" as const,
    value: {
      id: "comment-3",
      author: mockPeople[2],
      insertedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      content: JSON.stringify({
        message: "The dark mode implementation is looking great! Should be ready for review tomorrow.",
      }),
      reactions: [{ id: "reaction-3", emoji: "🔥", count: 3, reacted: false }],
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-6",
      type: "task-status-change" as const,
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      fromStatus: "in_progress" as const,
      toStatus: "done" as const,
      task: {
        id: "task-6",
        title: "Create presentation for stakeholders",
        status: "done" as const,
      },
    },
  },
];

// Mock description content
const mockDescription = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This milestone represents our Q2 feature release, focusing on core user experience improvements and new functionality. The main goals include:",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Implement robust user authentication system",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Add dark mode support across the application",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Improve navigation and user profile functionality",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We expect this release to significantly improve user engagement and provide a foundation for future feature development.",
        },
      ],
    },
  ],
};

/**
 * Full Project Context - Shows MilestonePage within a ProjectPage-like structure
 */
export function InProjectContextStory() {
  const [tasks, setTasks] = useState([...milestoneTasks]);
  const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
  const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskBoardTypes.Status) => {
    console.log("Task status change:", taskId, newStatus);
    const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    setTasks(updatedTasks);
  };

  const handleTaskCreate = (newTaskData: Omit<TaskBoardTypes.Task, "id">) => {
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTask = { id: taskId, ...newTaskData };
    console.log("Task created:", newTask);
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<TaskBoardTypes.Task>) => {
    console.log("Task updated:", taskId, updates);
    const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
    setTasks(updatedTasks);
  };

  const handleTaskReorder = (reorderedTasks: TaskBoardTypes.Task[]) => {
    console.log("Tasks reordered:", reorderedTasks);
    setTasks(reorderedTasks);
  };

  const handleMilestoneUpdate = (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => {
    console.log("Milestone updated:", milestoneId, updates);

    // Update the milestone in the milestones array
    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
    );
    setMilestones(updatedMilestones);
  };

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
    tasks: tasks,
    milestones: milestones,
    onTaskStatusChange: handleTaskStatusChange,
    onTaskCreate: handleTaskCreate,
    onMilestoneCreate: () => {},
    onTaskUpdate: handleTaskUpdate,
    onMilestoneUpdate: handleMilestoneUpdate,
    searchPeople: mockSearchPeople,
    filters: filters,
    onFiltersChange: setFilters,
  };

  const tabs = useTabs("tasks", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    {
      id: "tasks",
      label: "Tasks",
      icon: <IconListCheck size={14} />,
      count: tasks.filter((task) => !task._isHelperTask).length,
    },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
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
            <MilestonePage
              milestone={milestones.find((m) => m.id === targetMilestone.id) || targetMilestone}
              tasks={tasks}
              milestones={milestones}
              onStatusChange={handleTaskStatusChange}
              onTaskCreate={handleTaskCreate}
              onTaskReorder={handleTaskReorder}
              onTaskUpdate={handleTaskUpdate}
              onMilestoneUpdate={handleMilestoneUpdate}
              onMilestoneNameChange={async (newName) => {
                console.log("Milestone name changed:", newName);
                return true;
              }}
              searchPeople={mockSearchPeople}
              filters={filters}
              onFiltersChange={setFilters}
              timelineItems={createMockTimelineItems()}
              currentUser={mockPeople[0]!}
              canComment={true}
              onAddComment={(comment) => console.log("Add comment:", comment)}
              onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
              createdBy={mockPeople[0]}
              createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
              isSubscribed={isSubscribed}
              onSubscriptionToggle={(subscribed) => {
                console.log("Subscription toggled:", subscribed);
                setIsSubscribed(subscribed);
              }}
              onCopyUrl={() => console.log("URL copied")}
              onArchive={() => console.log("Milestone archived")}
              onDelete={() => console.log("Milestone deleted")}
              canEdit={true}
              description={mockDescription}
              onDescriptionChange={async (newDescription) => {
                console.log("Description changed:", newDescription);
                return true;
              }}
              mentionedPersonLookup={(id) => mockPeople.find((p) => p.id === id)}
              peopleSearch={mockSearchPeople}
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

/**
 * Empty Milestone in Full Project Context - Shows an empty MilestonePage within a ProjectPage-like structure
 */
export function EmptyMilestoneInProjectContextStory() {
  const [tasks, setTasks] = useState<TaskBoardTypes.Task[]>([]); // Empty tasks array
  const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>([emptyMilestone]);
  const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskBoardTypes.Status) => {
    console.log("Task status change:", taskId, newStatus);
    const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    setTasks(updatedTasks);
  };

  const handleTaskCreate = (newTaskData: Omit<TaskBoardTypes.Task, "id">) => {
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTask = { id: taskId, ...newTaskData };
    console.log("Task created:", newTask);
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<TaskBoardTypes.Task>) => {
    console.log("Task updated:", taskId, updates);
    const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
    setTasks(updatedTasks);
  };

  const handleTaskReorder = (reorderedTasks: TaskBoardTypes.Task[]) => {
    console.log("Tasks reordered:", reorderedTasks);
    setTasks(reorderedTasks);
  };

  const handleMilestoneUpdate = (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => {
    console.log("Milestone updated:", milestoneId, updates);

    // Update the milestone in the milestones array
    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
    );
    setMilestones(updatedMilestones);
  };

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
    tasks: tasks,
    milestones: milestones,
    onTaskStatusChange: handleTaskStatusChange,
    onTaskCreate: handleTaskCreate,
    onMilestoneCreate: () => {},
    onTaskUpdate: handleTaskUpdate,
    onMilestoneUpdate: handleMilestoneUpdate,
    searchPeople: mockSearchPeople,
    filters: filters,
    onFiltersChange: setFilters,
  };

  const tabs = useTabs("tasks", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    {
      id: "tasks",
      label: "Tasks",
      icon: <IconListCheck size={14} />,
      count: tasks.filter((task) => !task._isHelperTask).length,
    },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
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
            <MilestonePage
              milestone={milestones.find((m) => m.id === emptyMilestone.id) || emptyMilestone}
              tasks={tasks}
              milestones={milestones}
              onStatusChange={handleTaskStatusChange}
              onTaskCreate={handleTaskCreate}
              onTaskReorder={handleTaskReorder}
              onTaskUpdate={handleTaskUpdate}
              onMilestoneUpdate={handleMilestoneUpdate}
              onMilestoneNameChange={async (newName) => {
                console.log("Milestone name changed:", newName);
                return true;
              }}
              searchPeople={mockSearchPeople}
              filters={filters}
              onFiltersChange={setFilters}
              timelineItems={[
                {
                  type: "milestone-activity" as const,
                  value: {
                    id: "activity-1",
                    author: mockPeople[0], // Alice created the empty milestone
                    insertedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    content: "created the milestone",
                    type: "milestone-created",
                  },
                },
              ]}
              currentUser={mockPeople[0]!}
              canComment={true}
              onAddComment={(comment) => console.log("Add comment:", comment)}
              onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
              createdBy={mockPeople[0]}
              createdAt={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)} // 2 days ago
              isSubscribed={isSubscribed}
              onSubscriptionToggle={(subscribed) => {
                console.log("Subscription toggled:", subscribed);
                setIsSubscribed(subscribed);
              }}
              onCopyUrl={() => console.log("URL copied")}
              onArchive={() => console.log("Milestone archived")}
              onDelete={() => console.log("Milestone deleted")}
              canEdit={true}
              description={null}
              onDescriptionChange={async (newDescription) => {
                console.log("Description changed:", newDescription);
                return true;
              }}
              mentionedPersonLookup={(id) => mockPeople.find((p) => p.id === id)}
              peopleSearch={mockSearchPeople}
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
