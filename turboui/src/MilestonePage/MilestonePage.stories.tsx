import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { InProjectContextStory, EmptyMilestoneInProjectContextStory } from "./InProjectContextStory";
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
};

// Create a set of tasks for the milestone
const createSampleTasks = (): Types.Task[] => [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: "done",
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
    milestone: sampleMilestone,
    description: null,
    dueDate: null
  },
  {
    id: "task-4",
    title: "Add support for dark mode",
    status: "pending",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 5)), "day"),
    description: null,
  },
  {
    id: "task-5",
    title: "Write documentation",
    status: "done",
    milestone: sampleMilestone,
    hasDescription: true,
    description: null,
    dueDate: null
  },
  {
    id: "task-6",
    title: "Create presentation for stakeholders",
    status: "in_progress",
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
        ...newTaskData,
      };

      // Add the new task to the list
      setTasks([...tasks, newTask]);
    };

    // Handler for reordering tasks
    const handleTaskReorder = (reorderedTasks: Types.Task[]) => {
      console.log("Tasks reordered:", reorderedTasks);
      setTasks(reorderedTasks);
    };

    // Handler for status changes
    const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
      setTasks(updatedTasks);
    };

    // Handler for due date changes
    const handleDueDateChange = (milestoneId: string, dueDate: DateField.ContextualDate | null) => {
      console.log("Due date changed:", { milestoneId, dueDate });
      // If dueDate is null, we're clearing the date
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        // Otherwise set the new date
        setMilestone({ ...milestone, dueDate });
      }
    };

    // Handler for milestone updates (including status)
    const handleMilestoneUpdate = (milestoneId: string, updates: Types.UpdateMilestonePayload) => {
      console.log("Milestone updated:", { milestoneId, updates });
      
      // Update the milestone with the provided updates
      setMilestone(prev => ({ ...prev, ...updates }));
    };

    // Handler for milestone name changes
    const handleMilestoneNameChange = async (newName: string) => {
      console.log("Milestone name changed:", newName);
      setMilestone(prev => ({ ...prev, name: newName }));
      return true;
    };

    return (
      <MilestonePage
        milestone={milestone}
        tasks={tasks}
        milestones={[milestone]}
        onTaskCreate={handleTaskCreate}
        onTaskReorder={handleTaskReorder}
        onStatusChange={handleStatusChange}
        onCommentCreate={(comment) => console.log("Comment created:", comment)}
        onDueDateChange={handleDueDateChange}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onTaskStatusChange={() => {}}
        onMilestoneUpdate={handleMilestoneUpdate}
        onMilestoneNameChange={handleMilestoneNameChange}
        searchPeople={mockSearchPeople}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={createMockTimelineItems()}
        currentUser={mockPeople[0]}
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
        mentionedPersonLookup={(id) => mockPeople.find(p => p.id === id)}
        peopleSearch={mockSearchPeople}
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
    });
    const [isSubscribed, setIsSubscribed] = useState(true);

    // Handler for due date changes
    const handleDueDateChange = (milestoneId: string, dueDate: DateField.ContextualDate | null) => {
      console.log("Due date changed:", { milestoneId, dueDate });
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
          author: mockPeople[1], // Bob Smith created it
          insertedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          content: "created the milestone",
          type: "milestone-created",
        },
      },
    ];

    return (
      <MilestonePage
        milestone={milestone}
        tasks={[]}
        milestones={[milestone]}
        onTaskCreate={(taskData) => console.log("Task created:", taskData)}
        onDueDateChange={handleDueDateChange}
        onTaskAssigneeChange={(taskId, assignee) => console.log("Task assignee updated:", taskId, assignee)}
        onTaskDueDateChange={(taskId, dueDate) => console.log("Task due date updated:", taskId, dueDate)}
        onTaskStatusChange={(taskId, status) => console.log("Task status updated:", taskId, status)}
        onMilestoneUpdate={(milestoneId, updates) => {
          console.log("Milestone updated:", { milestoneId, updates });
          if (updates.name) {
            setMilestone(prev => ({ ...prev, name: updates.name! }));
          }
        }}
        onMilestoneNameChange={async (newName) => {
          console.log("Milestone name changed:", newName);
          setMilestone(prev => ({ ...prev, name: newName }));
          return true;
        }}
        searchPeople={mockSearchPeople}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={emptyMilestoneTimeline}
        currentUser={mockPeople[0]}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        createdBy={mockPeople[1]}
        createdAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} // 3 days ago
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
        mentionedPersonLookup={(id) => mockPeople.find(p => p.id === id)}
        peopleSearch={mockSearchPeople}
      />
    );
  },
};


/**
 * Full Project Context - Shows MilestonePage within a complete ProjectPage experience
 */
export const InProjectContext: Story = {
  render: () => <InProjectContextStory />,
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Empty Milestone in Full Project Context - Shows an empty MilestonePage within a complete ProjectPage experience
 */
export const EmptyMilestoneInProjectContext: Story = {
  render: () => <EmptyMilestoneInProjectContextStory />,
  parameters: {
    layout: "fullscreen",
  },
};
