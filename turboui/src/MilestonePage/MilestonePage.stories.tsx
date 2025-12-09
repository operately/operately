import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { mockPeople, createMockTimelineItems, mockDescription } from "./mockData";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";

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

const DEFAULT_STATUS_OPTIONS: Types.Status[] = [
  { id: "pending", value: "pending", label: "Not started", color: "gray", icon: "circleDashed", index: 0 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "verification", value: "verification", label: "Verification", color: "blue", icon: "circleDot", index: 2 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 3 },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 4 },
];

const PENDING_STATUS = DEFAULT_STATUS_OPTIONS[0]!;
const IN_PROGRESS_STATUS = DEFAULT_STATUS_OPTIONS[1]!;
const DONE_STATUS = DEFAULT_STATUS_OPTIONS[3]!;

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

const longTitleOne =
  "Coordinate cross-functional launch strategy across marketing, sales, support, and product to keep messaging aligned through release";
const longTitleTwo =
  "Document post-launch follow-up plan covering customer outreach, success enablement, analytics tracking, and executive reporting milestones";

// Create a set of tasks for the milestone
const createSampleTasks = (): Types.Task[] => [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: DONE_STATUS,
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[0]!],
    hasComments: true,
    commentCount: 2,
    description: null,
    dueDate: null,
    type: "project"
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: IN_PROGRESS_STATUS,
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[1]!],
    hasDescription: true,
    description: null,
    dueDate: null,
    type: "project"
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: PENDING_STATUS,
    link: "#",
    milestone: sampleMilestone,
    description: null,
    dueDate: null,
    type: "project"
  },
  {
    id: "task-4",
    title: "Add support for dark mode",
    status: PENDING_STATUS,
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 5)), "day"),
    description: null,
    type: "project"
  },
  {
    id: "task-5",
    title: "Write documentation",
    status: DONE_STATUS,
    link: "#",
    milestone: sampleMilestone,
    hasDescription: true,
    description: null,
    dueDate: null,
    type: "project"
  },
  {
    id: "task-6",
    title: "Create presentation for stakeholders",
    status: IN_PROGRESS_STATUS,
    link: "#",
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 2)), "day"),
    hasComments: true,
    commentCount: 1,
    description: null,
    type: "project"
  },
  {
    id: "task-7",
    title: longTitleOne,
    status: PENDING_STATUS,
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[0]!],
    description: null,
    dueDate: null,
    hasComments: false,
    type: "project"
  },
  {
    id: "task-8",
    title: longTitleTwo,
    status: IN_PROGRESS_STATUS,
    link: "#",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    description: null,
    dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 9)), "day"),
    hasDescription: true,
    hasComments: true,
    commentCount: 4,
    type: "project"
  },
];



/**
 * Basic example with interactive task creation and reordering
 */
export const Default: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    
    // State for tasks and milestone
    const [tasks, setTasks] = useState<Types.Task[]>(createSampleTasks());
    const [milestone, setMilestone] = useState<Types.Milestone>(sampleMilestone);

    const subscriptions = useMockSubscriptions({ entityType: "milestone" });

    // Handler for creating a new task
    const handleTaskCreate = (newTaskData: Types.NewTaskPayload) => {
      // Generate a fake ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new task with the generated ID
      const newTask: Types.Task = {
        id: taskId,
        status: PENDING_STATUS,
        description: "",
        link: "#",
        type: "project",
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
        childrenCount={{
          tasksCount: tasks.length,
          discussionsCount: 2,
          checkInsCount: 1,
        }}
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
        assigneePersonSearch={assigneePersonSearch}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={createMockTimelineItems()}
        currentUser={mockPeople[0]!}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[0] || null}
        createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
        subscriptions={subscriptions}
        onDelete={() => console.log("Milestone deleted")}
        canEdit={true}
        description={mockDescription}
        onDescriptionChange={async (newDescription) => {
          console.log("Description changed:", newDescription);
          return true;
        }}
        richTextHandlers={createMockRichEditorHandlers()}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};

/**
 * Empty milestone with no tasks yet
 */
export const EmptyMilestone: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    const subscriptions = useMockSubscriptions({ entityType: "milestone" });
    
    // Use state to manage the milestone with its due date
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-empty",
      name: "New Initiative Planning",
      hasDescription: true,
      hasComments: false,
      status: "pending", // Add initial status
      link: "#",
    });

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
        childrenCount={{
          tasksCount: 0,
          discussionsCount: 0,
          checkInsCount: 0,
        }}
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
        assigneePersonSearch={assigneePersonSearch}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={emptyMilestoneTimeline}
        currentUser={mockPeople[0]!}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[1] || null}
        createdAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} // 3 days ago
        subscriptions={subscriptions}
        onDelete={() => console.log("Milestone deleted")}
        canEdit={true}
        description={null}
        onDescriptionChange={async (newDescription) => {
          console.log("Description changed:", newDescription);
          return true;
        }}
        richTextHandlers={createMockRichEditorHandlers()}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};

/**
 * Completed milestone with all tasks finished
 */
export const CompletedMilestone: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    const subscriptions = useMockSubscriptions({ entityType: "milestone" });
    
    // Create a completed milestone
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-completed",
      name: "Q1 Feature Release",
      dueDate: createContextualDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), "day"), // 5 days ago
      hasDescription: true,
      hasComments: true,
      commentCount: 8,
      status: "done", // Milestone is completed
      link: "#",
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });

    // Create completed tasks for the milestone
    const [tasks] = useState<Types.Task[]>([
      {
        id: "task-completed-1",
        title: "Implement OAuth integration",
        status: DONE_STATUS,
        link: "#",
        milestone: milestone,
        assignees: [mockPeople[0]!],
        hasComments: true,
        commentCount: 5,
        description: null,
        dueDate: createContextualDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), "day"), // 8 days ago
        type: "project"
      },
      {
        id: "task-completed-2",
        title: "Redesign dashboard UI",
        status: DONE_STATUS,
        link: "#",
        milestone: milestone,
        assignees: [mockPeople[1]!, mockPeople[2]!],
        hasDescription: true,
        description: null,
        dueDate: createContextualDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "day"), // 7 days ago
        type: "project"
      },
      {
        id: "task-completed-3",
        title: "Fix performance issues in data loading",
        status: DONE_STATUS,
        link: "#",
        milestone: milestone,
        assignees: [mockPeople[0]!],
        description: null,
        dueDate: createContextualDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), "day"), // 6 days ago
        type: "project"
      },
      {
        id: "task-completed-4",
        title: "Update API documentation",
        status: DONE_STATUS,
        link: "#",
        milestone: milestone,
        assignees: [mockPeople[2]!],
        hasDescription: true,
        hasComments: true,
        commentCount: 2,
        description: null,
        dueDate: createContextualDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), "day"), // 6 days ago
        type: "project"
      },
      {
        id: "task-completed-5",
        title: "Deploy to production",
        status: DONE_STATUS,
        link: "#",
        milestone: milestone,
        assignees: [mockPeople[1]!],
        description: null,
        dueDate: createContextualDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), "day"), // 5 days ago
        type: "project"
      },
    ]);

    // Create timeline items showing the completion process
    const completedMilestoneTimeline = [
      {
        type: "milestone-activity" as const,
        value: {
          id: "activity-creation",
          author: mockPeople[0]!, 
          insertedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
          content: "created the milestone",
          type: "project_milestone_creation" as const,
        },
      },
      {
        type: "task-activity" as const,
        value: {
          id: "activity-task-completion",
          type: "task_status_updating" as const,
          author: mockPeople[0]!,
          insertedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
          fromStatus: IN_PROGRESS_STATUS,
          toStatus: DONE_STATUS,
          taskName: "Implement OAuth integration",
          page: "milestone" as const,
          task: {
            id: "task-completed-1",
            title: "Implement OAuth integration",
            status: DONE_STATUS,
          },
        },
      },
      {
        type: "task-activity" as const,
        value: {
          id: "activity-task-completion-2",
          type: "task_status_updating" as const,
          author: mockPeople[1]!,
          insertedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          fromStatus: IN_PROGRESS_STATUS,
          toStatus: DONE_STATUS,
          taskName: "Redesign dashboard UI",
          page: "milestone" as const,
          task: {
            id: "task-completed-2",
            title: "Redesign dashboard UI",
            status: DONE_STATUS,
          },
        },
      },
      {
        type: "milestone-activity" as const,
        value: {
          id: "activity-completion",
          author: mockPeople[1]!,
          insertedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          content: "marked the milestone as complete",
          type: "milestone-completed" as const,
        },
      },
    ];

    // Handler for due date changes (should be disabled for completed milestones)
    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      console.log("Due date change attempted on completed milestone:", { dueDate });
      // In a real app, you might want to prevent changes to completed milestones
    };

    // Handler for milestone name changes (should be disabled for completed milestones)
    const handleMilestoneNameChange = async (newName: string) => {
      console.log("Name change attempted on completed milestone:", newName);
      // In a real app, you might want to prevent changes to completed milestones
      return false; // Return false to indicate the change was not allowed
    };

    return (
      <MilestonePage
        projectName="Product Development"
        projectLink="#"
        workmapLink="#"
        childrenCount={{
          tasksCount: tasks.length,
          discussionsCount: 3,
          checkInsCount: 2,
        }}
        space={{
          id: "1",
          name: "Engineering",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        milestone={milestone}
        tasks={tasks}
        onTaskCreate={(taskData) => console.log("Task creation attempted on completed milestone:", taskData)}
        onTaskReorder={(taskId, milestoneId, index) => console.log("Task reorder attempted:", { taskId, milestoneId, index })}
        status={milestone.status}
        onStatusChange={(status) => {
          console.log("Milestone status change:", status);
          setMilestone(prev => ({ ...prev, status: status as "pending" | "done" }));
        }}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskAssigneeChange={(taskId, assignee) => console.log("Task assignee change attempted:", taskId, assignee)}
        onTaskDueDateChange={(taskId, dueDate) => console.log("Task due date change attempted:", taskId, dueDate)}
        onTaskStatusChange={(taskId, status) => console.log("Task status change attempted:", taskId, status)}
        onMilestoneTitleChange={handleMilestoneNameChange}
        title={milestone.name}
        assigneePersonSearch={assigneePersonSearch}
        filters={[]}
        onFiltersChange={(filters) => console.log("Filters changed:", filters)}
        timelineItems={completedMilestoneTimeline}
        currentUser={mockPeople[0]!}
        canComment={true}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[0] || null}
        createdAt={new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)} // 21 days ago
        subscriptions={subscriptions}
        onDelete={() => console.log("Milestone delete attempted")}
        canEdit={true}
        description={mockDescription}
        onDescriptionChange={async (newDescription) => {
          console.log("Description change attempted on completed milestone:", newDescription);
          return true;
        }}
        richTextHandlers={createMockRichEditorHandlers()}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};
