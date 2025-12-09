import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import * as Types from "../types";
import { TaskBoard } from "../components";
import { mockTasks, mockMilestones } from "../tests/mockData";
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
    
    // Create state for tasks and task creation
    const [tasks, setTasks] = useState([...mockTasks("project")]);
    const [milestones, setMilestones] = useState<Types.Milestone[]>([
      ...Object.values(mockMilestones),
    ]);
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

    const handleTaskCreate = (newTaskData) => {
      // Generate a fake UUID for the new task
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new task object
      const newTask = {
        id: taskId,
        ...newTaskData,
      };

      console.log("=== Created new task ===\n", JSON.stringify(newTask, null, 2));
      console.log("Current tasks count:", tasks.length);

      // Add the new task to the list
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      console.log("New tasks count:", updatedTasks.length);
    };

    const handleMilestoneCreate = (newMilestoneData) => {
      // Generate a fake UUID for the new milestone
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new milestone object
      const newMilestone = {
        id: milestoneId,
        ...newMilestoneData,
      };

      console.log("=== Created new milestone ===\n", JSON.stringify(newMilestone, null, 2));

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleTaskStatusChange = (taskId: string, status: Types.Status) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
    };

    return (
      <TaskBoard
        tasks={tasks}
        milestones={milestones}
        searchableMilestones={searchableMilestones}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={(taskId, assignee) => {
          console.log('Task assignee updated:', taskId, assignee);
        }}
        onTaskDueDateChange={(taskId, dueDate) => {
          console.log('Task due date updated:', taskId, dueDate);
        }}
        onTaskStatusChange={handleTaskStatusChange}
        onMilestoneSearch={handleMilestoneSearch}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        statuses={statuses}
        onSaveCustomStatuses={(nextStatuses) => {
          console.log('Statuses updated:', nextStatuses);
          setStatuses(nextStatuses);
        }}
        canManageStatuses={true}
      />
    );
  },
};
