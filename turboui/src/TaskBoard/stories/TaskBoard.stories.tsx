import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import * as Types from "../types";
import { TaskBoard } from "../components";
import { createContextualDate } from "../../DateField/mockData";
import { DONE_STATUS, mockMilestones, mockTasks, PENDING_STATUS } from "../tests/mockData";
import { Page } from "../../Page";
import { usePersonFieldSearch } from "../../utils/storybook/usePersonFieldSearch";

const DEFAULT_STATUSES: Types.Status[] = [
  { id: "pending", value: "pending", label: "Not started", color: "gray", icon: "circleDashed", index: 0 },
  { id: "progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "qa", value: "qa", label: "QA", color: "blue", icon: "circleDot", index: 2 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 3 },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 4 },
];

/**
 * TaskBoard is a comprehensive task management component designed for teams.
 */
const meta: Meta<typeof TaskBoard> = {
  title: "Components/TaskBoard",
  component: TaskBoard,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    tasks: { control: "object" },
  },
  decorators: [
    (Story) => (
      <div className="h-[800px] py-[4.5rem] px-2">
        <Page title="Tasks" size="fullwidth">
          <Story />
        </Page>
      </div>
    ),
  ],
} satisfies Meta<typeof TaskBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default table view of the TaskBoard with working task creation and milestone creation
 */
// Mock people data for assignee selection
const mockPeople: Types.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

export const Default: Story = {
  tags: ["autodocs"],
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    const [displayMode, setDisplayMode] = useState<Types.TaskDisplayMode>("list");

    // Create state for tasks and task creation
    const [tasks, setTasks] = useState([...mockTasks("project")]);
    const [milestones, setMilestones] = useState<Types.Milestone[]>([...Object.values(mockMilestones)]);
    const [searchableMilestones, setSearchableMilestones] = useState<Types.Milestone[]>([
      ...Object.values(mockMilestones),
    ]);
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);
    const [statuses, setStatuses] = useState<Types.Status[]>(DEFAULT_STATUSES);

    const handleMilestoneSearch = async (query: string) => {
      const allMilestones = Object.values(mockMilestones);
      const filtered = allMilestones.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
      setSearchableMilestones(filtered);
    };

    const handleTaskCreate = (newTaskData: Types.NewTaskPayload) => {
      // Generate a fake UUID for the new task
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new task object
      const newTask: Types.Task = {
        id: taskId,
        ...newTaskData,
        status: null,
        description: null,
        link: "#",
        milestone: newTaskData.milestone,
        dueDate: newTaskData.dueDate,
        type: "project",
      };

      console.log("=== Created new task ===\n", JSON.stringify(newTask, null, 2));
      console.log("Current tasks count:", tasks.length);

      // Add the new task to the list
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      console.log("New tasks count:", updatedTasks.length);
    };

    const handleMilestoneCreate = (newMilestoneData: Types.NewMilestonePayload) => {
      // Generate a fake UUID for the new milestone
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new milestone object
      const newMilestone: Types.Milestone = {
        id: milestoneId,
        ...newMilestoneData,
      };

      console.log("=== Created new milestone ===\n", JSON.stringify(newMilestone, null, 2));

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleTaskStatusChange = (taskId: string, status: Types.Status | null) => {
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status } : task)));
    };

    return (
      <TaskBoard
        tasks={tasks}
        milestones={milestones}
        searchableMilestones={searchableMilestones}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={(taskId, assignees) => {
          console.log("Task assignees updated:", taskId, assignees);
        }}
        onTaskDueDateChange={(taskId, dueDate) => {
          console.log("Task due date updated:", taskId, dueDate);
        }}
        onTaskStatusChange={handleTaskStatusChange}
        onMilestoneSearch={handleMilestoneSearch}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        statuses={statuses}
        onSaveCustomStatuses={(data) => {
          console.log("Statuses updated:", data.nextStatuses);
          console.log("Deleted status replacements:", data.deletedStatusReplacements);
          setStatuses(data.nextStatuses);
        }}
        canManageStatuses={true}
        canCreateMilestone={true}
        canCreateTask={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    );
  },
};

export const CompletedMilestonesAtEnd: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    const [displayMode, setDisplayMode] = useState<Types.TaskDisplayMode>("list");
    const openMilestone: Types.Milestone = {
      ...mockMilestones.q2Release!,
      id: "open-milestone",
      name: "Launch prep",
      status: "pending",
    };
    const completedMilestone: Types.Milestone = {
      ...mockMilestones.completedMilestone1!,
      id: "completed-milestone",
      name: "Discovery wrapped",
      status: "done",
      dueDate: createContextualDate("2025-03-15", "day"),
    };

    const [milestones] = useState<Types.Milestone[]>([openMilestone, completedMilestone]);
    const [searchableMilestones, setSearchableMilestones] = useState<Types.Milestone[]>([
      openMilestone,
      completedMilestone,
    ]);
    const [tasks, setTasks] = useState<Types.Task[]>([
      {
        id: "open-task",
        title: "Ship the release checklist",
        status: PENDING_STATUS,
        description: null,
        link: "#",
        milestone: openMilestone,
        dueDate: createContextualDate("2025-08-10", "day"),
        type: "project",
      },
      {
        id: "no-milestone-task",
        title: "Coordinate stakeholder review",
        status: PENDING_STATUS,
        description: null,
        link: "#",
        milestone: null,
        dueDate: null,
        type: "project",
      },
      {
        id: "completed-task",
        title: "Wrap discovery interviews",
        status: DONE_STATUS,
        description: null,
        link: "#",
        milestone: completedMilestone,
        dueDate: null,
        closedAt: new Date("2025-03-18T00:00:00Z"),
        type: "project",
      },
    ]);
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);
    const [statuses, setStatuses] = useState<Types.Status[]>(DEFAULT_STATUSES);

    const handleMilestoneSearch = async (query: string) => {
      const normalizedQuery = query.toLowerCase();
      setSearchableMilestones(milestones.filter((milestone) => milestone.name.toLowerCase().includes(normalizedQuery)));
    };

    return (
      <TaskBoard
        tasks={tasks}
        milestones={milestones}
        searchableMilestones={searchableMilestones}
        onTaskCreate={(task) => {
          const nextTask: Types.Task = {
            id: `task-${Date.now()}`,
            title: task.title,
            status: task.status ?? null,
            description: null,
            link: "#",
            milestone: task.milestone,
            dueDate: task.dueDate,
            assignees: [],
            type: "project",
          };

          setTasks((prev) => [...prev, nextTask]);
        }}
        onMilestoneCreate={() => {}}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onTaskStatusChange={(taskId, status) => {
          setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
        }}
        onMilestoneSearch={handleMilestoneSearch}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        statuses={statuses}
        onSaveCustomStatuses={(data) => {
          setStatuses(data.nextStatuses);
        }}
        canManageStatuses={true}
        canCreateMilestone={false}
        canCreateTask={true}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    );
  },
};
