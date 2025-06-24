import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { genPeople } from "../utils/storybook/genPeople";
import { InProjectContextStory, EmptyMilestoneInProjectContextStory } from "./InProjectContextStory";

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

// Generate a set of people for our mock data
const mockPeople = genPeople(4);

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }): Promise<Types.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Create a sample milestone with various properties
const sampleMilestone: Types.Milestone & { status?: string } = {
  id: "milestone-1",
  name: "Q2 Feature Release",
  dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 days from now
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
  status: "active", // Add initial status
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
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress",
    milestone: sampleMilestone,
    assignees: [mockPeople[1]!],
    hasDescription: true,
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "pending",
    milestone: sampleMilestone,
  },
  {
    id: "task-4",
    title: "Add support for dark mode",
    status: "pending",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
  },
  {
    id: "task-5",
    title: "Write documentation",
    status: "done",
    milestone: sampleMilestone,
    hasDescription: true,
  },
  {
    id: "task-6",
    title: "Create presentation for stakeholders",
    status: "in_progress",
    milestone: sampleMilestone,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    hasComments: true,
    commentCount: 1,
  },
];

// Mock timeline items for the default story
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
      content: JSON.stringify({ message: "Just wanted to update everyone on the progress. We're making good headway on the authentication system." }),
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
      content: JSON.stringify({ message: "The dark mode implementation is looking great! Should be ready for review tomorrow." }),
      reactions: [
        { id: "reaction-3", emoji: "🔥", count: 3, reacted: false },
      ],
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
 * Basic example with interactive task creation and reordering
 */
export const Default: Story = {
  render: () => {
    // State for tasks and milestone
    const [tasks, setTasks] = useState<Types.Task[]>(createSampleTasks());
    const [milestone, setMilestone] = useState<Types.Milestone>(sampleMilestone);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Handler for creating a new task
    const handleTaskCreate = (newTaskData: Omit<Types.Task, "id">) => {
      // Generate a fake ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new task with the generated ID
      const newTask: Types.Task = {
        id: taskId,
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
    const handleDueDateChange = (milestoneId: string, dueDate: Date | null) => {
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

    // Handler for task updates
    const handleTaskUpdate = (taskId: string, updates: Partial<Types.Task>) => {
      console.log(`Task ${taskId} updated:`, updates);

      // Update the task with the provided updates
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
      setTasks(updatedTasks);
    };

    // Handler for milestone updates (including status)
    const handleMilestoneUpdate = (milestoneId: string, updates: Partial<Types.Milestone>) => {
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
        onTaskUpdate={handleTaskUpdate}
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
    const [milestone, setMilestone] = useState<Types.Milestone & { status?: string }>({
      id: "milestone-empty",
      name: "New Initiative Planning",
      hasDescription: true,
      hasComments: false,
      status: "active", // Add initial status
    });
    const [isSubscribed, setIsSubscribed] = useState(true);

    // Handler for due date changes
    const handleDueDateChange = (milestoneId: string, dueDate: Date | null) => {
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
        onTaskUpdate={(taskId, updates) => console.log("Task updated:", taskId, updates)}
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
