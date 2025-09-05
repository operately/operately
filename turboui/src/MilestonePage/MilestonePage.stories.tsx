import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { mockPeople, createMockTimelineItems, mockDescription, mockSearchPeople } from "./mockData";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";

/**
 * MilestonePage displays a standalone page for a single milestone and its tasks.
 * It includes a header with milestone info, task list with filtering, and optional
 * description and comments sections.
 */
const meta: Meta<typeof MilestonePage> = {
  title: "Pages/MilestonePage",
  component: MilestonePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MilestonePage>;

export default meta;
type Story = StoryObj<typeof meta>;


// Create a sample milestone with various properties
const sampleMilestone: Types.Milestone = {
  id: "milestone-1",
  name: "Q2 Feature Release",
  dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 15)), "day"),
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
  status: "pending", // Add initial status
  link: "#",
};

// Create a set of tasks for the milestone
const createSampleTasks = (): Types.Task[] => [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: "done",
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[0]!],
    hasComments: true,
    commentCount: 2,
    description: null,
    dueDate: null
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress",
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[1]!],
    hasDescription: true,
    description: null,
    dueDate: null
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "pending",
    link: "#",
    milestone: sampleMilestone,
    description: null,
    dueDate: null
  },
  {
    id: "task-4",
    title: "Add support for dark mode",
    status: "pending",
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 5)), "day"),
    description: null,
  },
  {
    id: "task-5",
    title: "Write documentation",
    status: "done",
    link: "#",
    milestone: sampleMilestone,
    hasDescription: true,
    description: null,
    dueDate: null
  },
  {
    id: "task-6",
    title: "Create presentation for stakeholders",
    status: "in_progress",
    link: "#",
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 2)), "day"),
    hasComments: true,
    commentCount: 1,
    description: null,
  },
];



/**
 * Basic example with interactive task creation and reordering
 */
export const Default: Story = {
  render: () => {
    // State for tasks and milestone
    const [tasks, setTasks] = useState<Types.Task[]>(createSampleTasks());
    const [milestone, setMilestone] = useState<Types.Milestone>(sampleMilestone);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Handler for creating a new task
    const handleTaskCreate = (newTaskData: Types.NewTaskPayload) => {
      // Generate a fake ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new task with the generated ID
      const newTask: Types.Task = {
        id: taskId,
        status: "pending",
        description: "",
        link: "#",
        ...newTaskData,
      };

      // Add the new task to the list
      setTasks([...tasks, newTask]);
    };

    // Handler for reordering tasks
    const handleTaskReorder = (taskId: string, milestoneId: string | null, index: number) => {
      console.log("Task reordered:", { taskId, milestoneId, index });

      // Find the task to move
      const taskToMove = tasks.find(t => t.id === taskId);
      if (!taskToMove) return;

      // Remove the task from its current position
      const newTasks = tasks.filter(t => t.id !== taskId);
      
      // Insert the task at the new position
      newTasks.splice(index, 0, taskToMove);
      
      setTasks(newTasks);
    };


    // Handler for due date changes
    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      console.log("Due date changed:", { dueDate });
      // If dueDate is null, we're clearing the date
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        // Otherwise set the new date
        setMilestone({ ...milestone, dueDate });
      }
    };

    // Handler for milestone name changes
    const handleMilestoneNameChange = async (newName: string) => {
      console.log("Milestone name changed:", newName);
      setMilestone(prev => ({ ...prev, name: newName }));
      return true;
    };

    return (
      <MilestonePage
        projectName="Demo Project"
        projectLink="#"
        workmapLink="#"
        space={{
          id: "1",
          name: "Product",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        milestone={milestone}
        tasks={tasks}
        onTaskCreate={handleTaskCreate}
        onTaskReorder={handleTaskReorder}
        status={milestone.status}
        onStatusChange={(status) => {
          console.log("Milestone status changed:", status);
        }}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onTaskStatusChange={() => {}}
        onMilestoneTitleChange={handleMilestoneNameChange}
        title={milestone.name}
        searchPeople={async ({ query }) => {
          const people = await mockSearchPeople({ query });
          return people.map(person => ({ ...person, profileLink: "#" }));
        }}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={createMockTimelineItems()}
        currentUser={mockPeople[0]!}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        createdBy={mockPeople[0] || null}
        createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
        isSubscribed={isSubscribed}
        onSubscriptionToggle={(subscribed) => {
          console.log("Subscription toggled:", subscribed);
          setIsSubscribed(subscribed);
        }}
        onDelete={() => console.log("Milestone deleted")}
        canEdit={true}
        description={mockDescription}
        onDescriptionChange={async (newDescription) => {
          console.log("Description changed:", newDescription);
          return true;
        }}
        mentionedPersonLookup={async (id) => {
          const person = mockPeople.find(p => p.id === id);
          return person ? { ...person, profileLink: "#", title: "" } : null;
        }}
      />
    );
  },
};

/**
 * Empty milestone with no tasks yet
 */
export const EmptyMilestone: Story = {
  render: () => {
    // Use state to manage the milestone with its due date
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-empty",
      name: "New Initiative Planning",
      hasDescription: true,
      hasComments: false,
      status: "pending", // Add initial status
      link: "#",
    });
    const [isSubscribed, setIsSubscribed] = useState(true);

    // Handler for due date changes
    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      console.log("Due date changed:", { dueDate });
      // If dueDate is null, we're clearing the date
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        // Otherwise set the new date
        setMilestone({ ...milestone, dueDate });
      }
    };

    // Empty milestone timeline - should always have creation activity
    const emptyMilestoneTimeline = [
      {
        type: "milestone-activity" as const,
        value: {
          id: "activity-1",
          author: mockPeople[1]!, // Bob Smith created it
          insertedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          content: "created the milestone",
          type: "project_milestone_creation" as const,
        },
      },
    ];

    return (
      <MilestonePage
        projectName="New Initiative"
        projectLink="#"
        milestone={milestone}
        tasks={[]}
        workmapLink="#"
        space={{
          id: "1",
          name: "Product",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        status={milestone.status}
        onStatusChange={(status) => {
          console.log("Milestone status changed:", status);
          setMilestone(prev => ({ ...prev, status: status as "pending" | "done" }));
        }}
        onTaskCreate={(taskData) => console.log("Task created:", taskData)}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskAssigneeChange={(taskId, assignee) => console.log("Task assignee updated:", taskId, assignee)}
        onTaskDueDateChange={(taskId, dueDate) => console.log("Task due date updated:", taskId, dueDate)}
        onTaskStatusChange={(taskId, status) => console.log("Task status updated:", taskId, status)}
        title={milestone.name}
        onMilestoneTitleChange={async (newName) => {
          console.log("Milestone name changed:", newName);
          setMilestone(prev => ({ ...prev, name: newName }));
          return true;
        }}
        searchPeople={async ({ query }) => {
          const people = await mockSearchPeople({ query });
          return people.map(person => ({ ...person, profileLink: "#" }));
        }}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={emptyMilestoneTimeline}
        currentUser={mockPeople[0]!}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        createdBy={mockPeople[1] || null}
        createdAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} // 3 days ago
        isSubscribed={isSubscribed}
        onSubscriptionToggle={(subscribed) => {
          console.log("Subscription toggled:", subscribed);
          setIsSubscribed(subscribed);
        }}
        onDelete={() => console.log("Milestone deleted")}
        canEdit={true}
        description={null}
        onDescriptionChange={async (newDescription) => {
          console.log("Description changed:", newDescription);
          return true;
        }}
        mentionedPersonLookup={async (id) => {
          const person = mockPeople.find(p => p.id === id);
          return person ? { ...person, profileLink: "#", title: "" } : null;
        }}
      />
    );
  },
};
