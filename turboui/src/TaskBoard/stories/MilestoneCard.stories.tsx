import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MilestoneCard } from "../components/MilestoneCard";
import * as Types from "../types";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../../utils/PragmaticDragAndDrop";
import { reorderTasksInList } from "../utils/taskReorderingUtils";
import { createContextualDate } from "../../DateField/mockData";
import { usePersonFieldSearch } from "../../utils/storybook/usePersonFieldSearch";

/**
 * MilestoneCard displays a milestone with its tasks, combining a header with progress
 * indicators and either a task list or an empty state.
 */
const meta: Meta<typeof MilestoneCard> = {
  title: "Components/TaskBoard/MilestoneCard",
  component: MilestoneCard,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (_, context) => {
      // Create a wrapper with state management for proper drag-and-drop
      const MilestoneCardWithDragAndDrop = () => {
        const [tasks, setTasks] = React.useState<Types.Task[]>([]);
        const [milestone, setMilestone] = React.useState<Types.Milestone>(context.args.milestone);
        
        // Initialize state from story args
        React.useEffect(() => {
          const { args } = context;
          if (args.tasks) setTasks([...args.tasks]);
          if (args.milestone) setMilestone({...args.milestone});
        }, [context.args]);
        
        // Handle drop events to update task order
        const handleTaskMove = React.useCallback(
          (move: BoardMove) => {
            console.log(
              `Dragged item ${move.itemId} was dropped onto ${move.destination.containerId} at index ${move.destination.index}`,
            );

            // Use the utility function to reorder tasks
            const updatedTasks = reorderTasksInList(tasks, move.itemId, move.destination.index);

            // Update state
            setTasks(updatedTasks);
          },
          [tasks],
        );

        const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);
        
        // Handle task creation
        const handleTaskCreate = (newTask: Types.NewTaskPayload) => {
          // Skip if milestone is not loaded
          if (!milestone) return;

          console.log(`Creating new task for ${milestone.name}:`, newTask);

          // Create a new task with an ID
          const taskWithId: Types.Task = {
            id: `task-${Date.now()}`, // Generate a unique ID
            status: PENDING_STATUS,
            description: "",
            link: "#",
            type: "project",
            ...newTask,
          };

          // Add the task to the list
          setTasks([...tasks, taskWithId]);
        };

        // Handle milestone updates (including due date changes)
        const handleMilestoneUpdate = (milestoneId: string, updates: Types.UpdateMilestonePayload) => {
          console.log(`Updating milestone ${milestoneId}:`, updates);
          
          setMilestone(prev => ({ ...prev, ...updates }));
        };

        // Mock people data
        const mockPeople: Types.Person[] = [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
          { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
          { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
          { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
        ];
        
        const assigneePersonSearch = usePersonFieldSearch(mockPeople);
        
        // Return early with loading state if milestone is not yet loaded
        if (!milestone) {
          return <div>Loading milestone...</div>;
        }
        
        return (
          <MilestoneCard
            milestone={milestone} 
            tasks={tasks}
            showHiddenTasksToggle={context.args.showHiddenTasksToggle ?? true}
            onTaskCreate={handleTaskCreate}
            onTaskAssigneeChange={(taskId, assignee) => {
              console.log('Task assignee updated:', taskId, assignee);
            }}
            onTaskDueDateChange={(taskId, dueDate) => {
              console.log('Task due date updated:', taskId, dueDate);
            }}
            onTaskStatusChange={(taskId, status) => {
              console.log('Task status updated:', taskId, status);
            }}
            onMilestoneUpdate={handleMilestoneUpdate}
            assigneePersonSearch={assigneePersonSearch}
            statusOptions={DEFAULT_STATUS_OPTIONS}
            availableMilestones={[milestone]}
            draggedItemId={draggedItemId}
            targetLocation={destination}
            placeholderHeight={draggedItemDimensions?.height ?? null}
          />
        );
      };
      
      return (
        <div className="m-4 w-[600px]">
          <ul className="list-none p-0 m-0 border border-surface-outline rounded-md">
            <MilestoneCardWithDragAndDrop />
          </ul>
        </div>
      );
    },
  ],
} satisfies Meta<typeof MilestoneCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample milestone data
const sampleMilestone: Types.Milestone = {
  id: "milestone-1",
  name: "Q2 Release",
  dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 10)), "day"),
  link: "#",
  kanbanLink: "#",
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
  status: "pending",
};

// Default status options used in MilestoneCard stories.
const DEFAULT_STATUS_OPTIONS: Types.Status[] = [
  {
    id: "pending",
    value: "pending",
    label: "Pending",
    icon: "circleDashed",
    color: "gray",
    index: 0,
  },
  {
    id: "in_progress",
    value: "in_progress",
    label: "In progress",
    icon: "circleDot",
    color: "blue",
    index: 1,
  },
  {
    id: "done",
    value: "done",
    label: "Done",
    icon: "circleCheck",
    color: "green",
    closed: true,
    index: 2,
  },
  {
    id: "canceled",
    value: "canceled",
    label: "Canceled",
    icon: "circleX",
    color: "red",
    closed: true,
    index: 3,
  },
];
const PENDING_STATUS = DEFAULT_STATUS_OPTIONS[0]!;
const IN_PROGRESS_STATUS = DEFAULT_STATUS_OPTIONS[1]!;
const DONE_STATUS = DEFAULT_STATUS_OPTIONS[2]!;
const CANCELED_STATUS = DEFAULT_STATUS_OPTIONS[3]!;

const longTitleOne =
  "Coordinate cross-functional launch strategy across marketing, sales, support, and product to keep messaging aligned through release";
const longTitleTwo =
  "Document post-launch follow-up plan covering customer outreach, success enablement, analytics tracking, and executive reporting milestones";

// Sample tasks for this milestone
const sampleTasks: Types.Task[] = [
  {
    id: "task-1",
    title: "Implement login functionality",
    status: PENDING_STATUS,
    description: "Implement user authentication and login flow",
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "day"),
    hasDescription: true,
    type: "project",
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: IN_PROGRESS_STATUS,
    description: "Create wireframes and design mockups for user profile",
    assignees: [
      { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
    ],
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), "day"), // 2 days ago (overdue)
    hasDescription: true,
    type: "project",
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: DONE_STATUS,
    description: "Resolve sidebar navigation issues and improve UX",
    assignees: [
      { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
    ],
    link: "#",
    hasComments: true,
    commentCount: 2,
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"), // 7 days from now
    type: "project",
  },
  {
    id: "task-4",
    title: "Task without due date or assignee - hover to set",
    status: PENDING_STATUS,
    description: null,
    link: "#",
    milestone: sampleMilestone,
    dueDate: null,
    hasComments: false,
    type: "project",
  },
  {
    id: "task-5",
    title: longTitleOne,
    status: IN_PROGRESS_STATUS,
    description: null,
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), "day"),
    hasComments: true,
    commentCount: 6,
    type: "project",
  },
  {
    id: "task-6",
    title: longTitleTwo,
    status: PENDING_STATUS,
    description: "Ensure every team knows their responsibilities after release",
    milestone: sampleMilestone,
    link: "#",
    dueDate: null,
    hasDescription: true,
    type: "project",
  },
];

/**
 * Default milestone card with multiple tasks
 */
export const DefaultMilestone: Story = {
  args: {
    milestone: sampleMilestone,
    tasks: sampleTasks,
    onTaskCreate: () => console.log("Create new task for this milestone"),
  },
};

/**
 * Milestone with a mix of task statuses showing progress
 */
export const MilestoneWithProgress: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Feature Implementation",
    },
    tasks: [
      ...sampleTasks,
      {
        id: "task-4",
        title: "Write documentation",
        status: DONE_STATUS,
        milestone: sampleMilestone,
      },
      {
        id: "task-5",
        title: "Deploy to production",
        status: DONE_STATUS,
        milestone: sampleMilestone,
      },
    ],
    onTaskCreate: () => console.log("Create new task for milestone with progress"),
  },
};

/**
 * Milestone with no tasks showing the empty state
 */
export const EmptyMilestone: Story = {
  args: {
    milestone: {
      id: "milestone-empty",
      name: "Backlog",
      // No additional properties like dueDate, comments or description
    },
    tasks: [],
    onTaskCreate: () => console.log("Create first task for empty milestone"),
  },
};

/**
 * Milestone without due date - shows hover-to-set behavior
 */
export const MilestoneWithoutDueDate: Story = {
  args: {
    milestone: {
      id: "milestone-no-date",
      name: "Research Phase - Hover header to set due date",
      hasDescription: true,
      hasComments: false,
      // No dueDate property
    },
    tasks: [
      {
        id: "task-research-1",
        title: "Market research analysis",
        status: IN_PROGRESS_STATUS,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        hasDescription: true,
      },
      {
        id: "task-research-2", 
        title: "Competitor analysis",
        status: PENDING_STATUS,
        hasComments: false,
      },
    ],
    onTaskCreate: () => console.log("Create new task for milestone without due date"),
  },
};

/**
 * Overdue milestone
 */
export const OverdueMilestone: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Phase 1",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
    },
    tasks: sampleTasks.slice(0, 2), // Just a couple tasks
    onTaskCreate: () => console.log("Create new task for overdue milestone"),
  },
};

/**
 * Milestone with hidden completed tasks - demonstrates the ghost row functionality
 * Shows only pending tasks by default, with a "Show X completed tasks" row to reveal hidden tasks
 */
export const MilestoneWithHiddenCompletedTasks: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Feature Complete - Click to reveal completed tasks",
    },
    // Only show pending and in-progress tasks
    tasks: [
      {
        id: "task-pending-1",
        title: "Final testing phase",
        status: PENDING_STATUS,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        hasDescription: true,
      },
      {
        id: "task-in-progress-1",
        title: "User acceptance testing",
        status: IN_PROGRESS_STATUS,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
        ],
        hasComments: true,
        commentCount: 1,
      },
      // Previously hidden completed / canceled tasks - now part of the main
      // tasks array; visibility is controlled via statusOptions.hidden
      {
        id: "task-done-1",
        title: "Implement core functionality",
        status: DONE_STATUS,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
        ],
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        hasDescription: true,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-done-2",
        title: "Set up CI/CD pipeline",
        status: DONE_STATUS,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
        ],
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: "task-done-3",
        title: "Create user documentation",
        status: DONE_STATUS,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        hasDescription: true,
      },
      {
        id: "task-canceled-1",
        title: "Old approach that was scrapped",
        status: CANCELED_STATUS,
        milestone: sampleMilestone,
        hasComments: true,
        commentCount: 2,
      },
    ],
    showHiddenTasksToggle: true, // Enable hidden tasks toggle functionality
    onTaskCreate: () => console.log("Create new task for milestone with hidden completed tasks"),
  },
};
