import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import * as Types from "../types";
import { TaskBoard } from "../components";
import TaskCreationModal from "../components/TaskCreationModal";
import MilestoneCreationModal from "../components/MilestoneCreationModal";
import { mockTasks, mockEmptyTasks, mockMilestones } from "../tests/mockData";
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

// Create a minimal milestone for testing different UI states
const standaloneTestMilestone: Types.Milestone = {
  id: "milestone-minimal",
  name: "Minimal Milestone",
  dueDate: undefined, // Using undefined instead of null to match the type definition
  hasDescription: false,
  hasComments: false,
};

/**
 * Default table view of the TaskBoard with working task creation and milestone creation
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: () => {
    // Create state for tasks and task creation
    const [tasks, setTasks] = useState([...mockTasks]);

    // Add the standalone milestone task and empty milestone to our tasks
    useEffect(() => {
      // Add a task with the standalone milestone
      const taskWithStandaloneMilestone = {
        id: "task-minimal-milestone",
        title: "This task demonstrates a minimal milestone",
        status: "pending" as Types.Status,
        milestone: standaloneTestMilestone,
      };

      // Create a helper task with the Empty Milestone from mockMilestones
      // This will make the empty milestone appear in the component
      const emptyMilestoneHelperTask = {
        id: "task-empty-milestone-helper",
        title: "Hidden helper task for Empty Milestone",
        status: "pending" as Types.Status,
        milestone: mockMilestones.emptyMilestone,
        _isHelperTask: true, // This flag tells the TaskBoard to hide this task
      };

      // Update tasks array with both our new tasks
      setTasks((prev) => [...prev, taskWithStandaloneMilestone, emptyMilestoneHelperTask]);
    }, []);

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

    const handleMilestoneCreate = (newMilestoneData) => {
      // Generate a fake UUID for the new milestone
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new milestone object
      const newMilestone = {
        id: milestoneId,
        ...newMilestoneData,
      };

      console.log("=== Created new milestone ===\n", JSON.stringify(newMilestone, null, 2));

      // For our Storybook demonstration, we need a way to make the new
      // milestone appear in the TaskBoard without automatically creating a task for it.
      // To do this, we'll create a special task that will make the milestone visible in the UI
      // but will be filtered out from display using the _isHelperTask flag

      // In a real application, this could be done by adding empty milestones to a separate
      // milestones array, but for now we'll use a hidden helper task to make it appear
      const helperTask = {
        id: `task-helper-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `Hidden helper task for ${newMilestone.name}`,
        status: "pending" as Types.Status,
        milestone: newMilestone,
        _isHelperTask: true, // This flag tells the TaskBoard to not display this task
      };

      // Add the helper task to the tasks array so the milestone appears
      const updatedTasks = [...tasks, helperTask];
      setTasks(updatedTasks);
    };

    return (
      <TaskBoard
        title="Tasks"
        tasks={tasks}
        viewMode="table"
        onStatusChange={handleStatusChange}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
      />
    );
  },
};
