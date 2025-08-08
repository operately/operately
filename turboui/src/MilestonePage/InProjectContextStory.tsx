import React, { useState } from "react";
import { MilestonePage } from "./index";
import { genPeople, searchPeopleFn } from "../utils/storybook/genPeople";
import { mockTasks, mockMilestones } from "../TaskBoard/tests/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { PageHeader } from "../ProjectPage/PageHeader";
import { IconClipboardText, IconLogs, IconMessage, IconMessages, IconListCheck } from "../icons";
import { mockPeople, createMockTimelineItems, mockDescription, mockSearchPeople } from "./mockData";
import { createContextualDate } from "../DateField/mockData";
import { parentGoalSearchFn } from "../utils/storybook/parentGoalSearchFn";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";

const people = genPeople(5);


// Get a specific milestone from mock data
const targetMilestone: TaskBoardTypes.Milestone = { ...Object.values(mockMilestones)[0]!, status: "pending" }; // Q2 Feature Release

// Create an empty milestone for the empty story
const emptyMilestone: TaskBoardTypes.Milestone = {
  id: "milestone-empty-project",
  name: "Q3 Planning Phase",
  dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 30)), "day"),
  hasDescription: false,
  hasComments: false,
  status: "pending",
};

// Filter tasks for this milestone
const milestoneTasks = mockTasks.filter((task) => task.milestone?.id === targetMilestone.id);

const defaultSpace = {
  id: "1",
  name: "Product",
  link: "#",
}

/**
 * Full Project Context - Shows MilestonePage within a ProjectPage-like structure
 */
export function InProjectContextStory() {
  const [tasks, setTasks] = useState([...milestoneTasks]);
  const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
  const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [space, setSpace] = useState(defaultSpace);

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

  const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
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
    space,
    setSpace,
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
    championSearch: searchPeopleFn,
    reviewerSearch: searchPeopleFn,
    setParentGoal: () => {},
    parentGoal: null,
    parentGoalSearch: parentGoalSearchFn,
    contributors: [],
    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),
    searchSpace: spaceSearchFn,
    mentionedPersonLookup: async () => null,
    newCheckInLink: "#",
    checkIns: [],
    newDiscussionLink: "#",
    discussions: [],
    resources: [],
    onResourceAdd: (resource: any) => {
      console.log("Resource added:", resource);
    },
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
  const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(
    // Ensure all milestones have the correct status types
    Object.values(mockMilestones).map(m => ({
      ...m,
      status: m.status === "done" ? "done" : "pending"
    })) as TaskBoardTypes.Milestone[]
  );
  const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [space, setSpace] = useState(defaultSpace);

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

  const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
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
    championSearch: searchPeopleFn,
    reviewerSearch: searchPeopleFn,
    setParentGoal: () => {},
    parentGoal: null,
    parentGoalSearch: parentGoalSearchFn,
    contributors: [],
    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),
    mentionedPersonLookup: async () => null,
    newCheckInLink: "#",
    checkIns: [],
    newDiscussionLink: "#",
    discussions: [],
    resources: [],
    onResourceAdd: (resource: any) => {
      console.log("Resource added:", resource);
    },
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
