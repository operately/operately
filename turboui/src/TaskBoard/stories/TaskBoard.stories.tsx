import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { TaskBoard } from "../components";
import TaskCreationModal from "../components/TaskCreationModal";
import { mockTasks, mockEmptyTasks } from "../tests/mockData";
import { Page } from "../../Page";

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
    viewMode: { control: "select", options: ["table", "kanban", "timeline"] },
  },
  decorators: [
    (Story, context) => (
      <div className="h-[800px] py-[4.5rem] px-2">
        <Page title={context.args.title || "Tasks"} size="fullwidth">
          <Story />
        </Page>
      </div>
    ),
  ],
} satisfies Meta<typeof TaskBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock people data for the assignee selection
const mockPeople = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Carol Williams", avatarUrl: "https://i.pravatar.cc/150?u=carol" },
];

// Extract milestones from mock tasks
const extractMilestones = (tasks) => {
  const milestoneMap = new Map();

  tasks.forEach((task) => {
    if (task.milestone && !milestoneMap.has(task.milestone.id)) {
      milestoneMap.set(task.milestone.id, task.milestone);
    }
  });

  return Array.from(milestoneMap.values());
};

/**
 * Default table view of the TaskBoard with working task creation
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: () => {
    // Create state for tasks and task creation
    const [tasks, setTasks] = useState([...mockTasks]);

    const handleStatusChange = (taskId, newStatus) => {
      console.log(`Task ${taskId} status changed to ${newStatus}`);

      // Update the task status locally
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
      setTasks(updatedTasks);
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

    return (
      <TaskBoard
        title="Task Board Demo"
        tasks={tasks}
        viewMode="table"
        onStatusChange={handleStatusChange}
        onTaskCreate={handleTaskCreate}
      />
    );
  },
};
