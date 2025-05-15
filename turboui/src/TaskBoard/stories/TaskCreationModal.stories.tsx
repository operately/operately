import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { TaskCreationModal } from "../components/TaskCreationModal";
import { PrimaryButton } from "../../Button";

// Sample data for all the stories
const sampleMilestones = [
  { id: "milestone-1", name: "Sprint 1", dueDate: new Date(2025, 5, 20) },
  { id: "milestone-2", name: "Sprint 2", dueDate: new Date(2025, 6, 3) },
  { id: "milestone-3", name: "Product Launch", dueDate: new Date(2025, 6, 15) },
];

const samplePeople = [
  { id: "person-1", fullName: "Jane Smith", avatarUrl: "https://i.pravatar.cc/150?img=1" },
  { id: "person-2", fullName: "John Doe", avatarUrl: "https://i.pravatar.cc/150?img=2" },
  { id: "person-3", fullName: "Alex Johnson", avatarUrl: "https://i.pravatar.cc/150?img=3" },
];

/**
 * TaskCreationModal is a modal dialog for creating new tasks in the TaskBoard.
 * It allows users to enter task details and optionally create multiple tasks in succession.
 */
const meta: Meta<typeof TaskCreationModal> = {
  title: "Components/TaskBoard/TaskCreationModal",
  component: TaskCreationModal,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    isOpen: { control: "boolean" },
    currentMilestoneId: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof TaskCreationModal>;

/**
 * Interactive story that demonstrates the TaskCreationModal
 */
export const Default: Story = {
  tags: ["autodocs"],
  args: {
    isOpen: false,
    onClose: () => {},
    onCreateTask: () => {},
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [taskCount, setTaskCount] = useState(0);
    const [lastTaskTitle, setLastTaskTitle] = useState("");

    const handleCreateTask = (task: any) => {
      console.log("Created task:", task);
      setTaskCount((count) => count + 1);
      setLastTaskTitle(task.title);
    };

    return (
      <div className="p-6 flex flex-col gap-4 max-w-lg">
        <div>
          <h3 className="text-lg font-semibold">Task Creation Demo</h3>
          <p className="text-content-subtle mt-1 mb-4">Click the button below to open the task creation modal</p>

          <PrimaryButton onClick={() => setIsOpen(true)}>+ Add Task</PrimaryButton>
        </div>

        {taskCount > 0 && (
          <div className="mt-2 p-4 bg-surface-accent rounded-md">
            <p className="text-sm font-medium">Tasks created: {taskCount}</p>
            {lastTaskTitle && <p className="text-sm text-content-subtle mt-1">Last task: "{lastTaskTitle}"</p>}
          </div>
        )}

        <TaskCreationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          milestones={sampleMilestones}
          people={samplePeople}
          onCreateTask={handleCreateTask}
        />
      </div>
    );
  },
};
