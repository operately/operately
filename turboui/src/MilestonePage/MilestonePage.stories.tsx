import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { mockPeople, createMockTimelineItems, mockDescription } from "./mockData";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import { useMockTaskBoardActions } from "../utils/storybook/tasks";
import { generatePermissions } from "../utils/storybook/permissions";
import {
  createSampleTemplateTasks,
  sampleTemplateMilestones,
  templateStatuses,
  templateStoryContext,
} from "./templateMockData";
import { useMockTemplateMilestoneTaskActions } from "../utils/storybook/templateTasks";

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
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: Partial<MilestonePage.Props>;
};

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
  kanbanLink: "#",
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

function reorderTasks(tasks: Types.Task[], taskId: string, destinationIndex: number) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return tasks;

  const remainingTasks = tasks.filter((item) => item.id !== taskId);
  const boundedIndex = Math.max(0, Math.min(destinationIndex, remainingTasks.length));
  remainingTasks.splice(boundedIndex, 0, task);
  return remainingTasks;
}



/**
 * Basic example with interactive task creation and reordering
 */
export const Default: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    const [tasks, setTasks] = useState<Types.Task[]>(createSampleTasks());
    const [milestone, setMilestone] = useState<Types.Milestone>(sampleMilestone);
    const subscriptions = useMockSubscriptions({ entityType: "milestone" });
    const taskActions = useMockTaskBoardActions({
      tasks,
      setTasks,
      statuses: DEFAULT_STATUS_OPTIONS,
      subscriptions,
    });
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);
    const [description, setDescription] = useState(mockDescription);
    const [isDeleted, setIsDeleted] = useState(false);

    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        setMilestone({ ...milestone, dueDate });
      }
    };

    const handleMilestoneNameChange = async (newName: string) => {
      setMilestone(prev => ({ ...prev, name: newName }));
      return true;
    };

    if (isDeleted) return <div className="p-6 text-content-subtle">Milestone deleted.</div>;

    return (
      <MilestonePage
        variant="project"
        projectName="Demo Project"
        projectLink="#"
        workmapLink="#"
        childrenCount={{
          tasksCount: tasks.length,
          discussionsCount: 2,
          checkInsCount: 1,
          docsAndFilesCount: 0,
        }}
        space={{
          id: "1",
          name: "Product",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        milestone={milestone}
        tasks={tasks}
        onTaskCreate={taskActions.onTaskCreate}
        onTaskReorder={(taskId, _milestoneId, index) => setTasks((prev) => reorderTasks(prev, taskId, index))}
        status={milestone.status}
        onStatusChange={(status) => setMilestone((prev) => ({ ...prev, status }))}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskNameChange={taskActions.onTaskNameChange}
        onTaskAssigneeChange={taskActions.onTaskAssigneeChange}
        onTaskDueDateChange={taskActions.onTaskDueDateChange}
        onTaskRemindersChange={taskActions.onTaskRemindersChange}
        onTaskStatusChange={taskActions.onTaskStatusChange}
        onTaskDescriptionChange={taskActions.onTaskDescriptionChange}
        onTaskDelete={taskActions.onTaskDelete}
        getTaskPageProps={taskActions.getTaskPageProps}
        onMilestoneTitleChange={handleMilestoneNameChange}
        title={milestone.name}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        timelineItems={createMockTimelineItems()}
        currentUser={mockPeople[0]!}
        permissions={generatePermissions(true)}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[0] || null}
        createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
        subscriptions={subscriptions}
        onDelete={() => setIsDeleted(true)}
        description={description}
        onDescriptionChange={async (newDescription) => {
          setDescription(newDescription);
          return true;
        }}
        richTextHandlers={createMockRichEditorHandlers()}
        formattedTimePreferences={defaultFormattedTimePreferences}
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
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-empty",
      name: "New Initiative Planning",
      hasDescription: true,
      hasComments: false,
      status: "pending", // Add initial status
      link: "#",
      kanbanLink: "#",
    });
    const [tasks, setTasks] = useState<Types.Task[]>([]);
    const taskActions = useMockTaskBoardActions({
      tasks,
      setTasks,
      statuses: DEFAULT_STATUS_OPTIONS,
      subscriptions,
    });
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);
    const [isDeleted, setIsDeleted] = useState(false);

    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
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

    if (isDeleted) return <div className="p-6 text-content-subtle">Milestone deleted.</div>;

    return (
      <MilestonePage
        variant="project"
        projectName="New Initiative"
        projectLink="#"
        milestone={milestone}
        tasks={tasks}
        workmapLink="#"
        childrenCount={{
          tasksCount: tasks.length,
          discussionsCount: 0,
          checkInsCount: 0,
          docsAndFilesCount: 0,
        }}
        space={{
          id: "1",
          name: "Product",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        status={milestone.status}
        onStatusChange={(status) => setMilestone((prev) => ({ ...prev, status }))}
        onTaskCreate={taskActions.onTaskCreate}
        onTaskReorder={(taskId, _milestoneId, index) => setTasks((prev) => reorderTasks(prev, taskId, index))}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskNameChange={taskActions.onTaskNameChange}
        onTaskAssigneeChange={taskActions.onTaskAssigneeChange}
        onTaskDueDateChange={taskActions.onTaskDueDateChange}
        onTaskRemindersChange={taskActions.onTaskRemindersChange}
        onTaskStatusChange={taskActions.onTaskStatusChange}
        onTaskDescriptionChange={taskActions.onTaskDescriptionChange}
        onTaskDelete={taskActions.onTaskDelete}
        getTaskPageProps={taskActions.getTaskPageProps}
        title={milestone.name}
        onMilestoneTitleChange={async (newName) => {
          setMilestone(prev => ({ ...prev, name: newName }));
          return true;
        }}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        timelineItems={emptyMilestoneTimeline}
        currentUser={mockPeople[0]!}
        permissions={generatePermissions(true)}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[1] || null}
        createdAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} // 3 days ago
        subscriptions={subscriptions}
        onDelete={() => setIsDeleted(true)}
        description={null}
        onDescriptionChange={async () => true}
        richTextHandlers={createMockRichEditorHandlers()}
        formattedTimePreferences={defaultFormattedTimePreferences}
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
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-completed",
      name: "Q1 Feature Release",
      dueDate: createContextualDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), "day"), // 5 days ago
      hasDescription: true,
      hasComments: true,
      commentCount: 8,
      status: "done", // Milestone is completed
      link: "#",
      kanbanLink: "#",
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });

    const [tasks, setTasks] = useState<Types.Task[]>([
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
    const taskActions = useMockTaskBoardActions({
      tasks,
      setTasks,
      statuses: DEFAULT_STATUS_OPTIONS,
      subscriptions,
    });
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);
    const [description, setDescription] = useState(mockDescription);
    const [isDeleted, setIsDeleted] = useState(false);

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

    const handleDueDateChange = (dueDate: DateField.ContextualDate | null) => {
      setMilestone((prev) => ({ ...prev, dueDate }));
    };

    const handleMilestoneNameChange = async (newName: string) => {
      setMilestone((prev) => ({ ...prev, name: newName }));
      return true;
    };

    if (isDeleted) return <div className="p-6 text-content-subtle">Milestone deleted.</div>;

    return (
      <MilestonePage
        variant="project"
        projectName="Product Development"
        projectLink="#"
        workmapLink="#"
        childrenCount={{
          tasksCount: tasks.length,
          discussionsCount: 3,
          checkInsCount: 2,
          docsAndFilesCount: 0,
        }}
        space={{
          id: "1",
          name: "Engineering",
          link: "#",
        }}
        updateProjectName={() => Promise.resolve(true)}
        milestone={milestone}
        tasks={tasks}
        onTaskCreate={taskActions.onTaskCreate}
        onTaskReorder={(taskId, _milestoneId, index) => setTasks((prev) => reorderTasks(prev, taskId, index))}
        status={milestone.status}
        onStatusChange={(status) => setMilestone((prev) => ({ ...prev, status }))}
        dueDate={milestone.dueDate || null}
        onDueDateChange={handleDueDateChange}
        onTaskNameChange={taskActions.onTaskNameChange}
        onTaskAssigneeChange={taskActions.onTaskAssigneeChange}
        onTaskDueDateChange={taskActions.onTaskDueDateChange}
        onTaskRemindersChange={taskActions.onTaskRemindersChange}
        onTaskStatusChange={taskActions.onTaskStatusChange}
        onTaskDescriptionChange={taskActions.onTaskDescriptionChange}
        onTaskDelete={taskActions.onTaskDelete}
        getTaskPageProps={taskActions.getTaskPageProps}
        onMilestoneTitleChange={handleMilestoneNameChange}
        title={milestone.name}
        assigneePersonSearch={assigneePersonSearch}
        filters={filters}
        onFiltersChange={setFilters}
        timelineItems={completedMilestoneTimeline}
        currentUser={mockPeople[0]!}
        permissions={generatePermissions(true)}
        onAddComment={(comment) => console.log("Add comment:", comment)}
        onEditComment={(commentId, content) => console.log("Edit comment:", { commentId, content })}
        onDeleteComment={(commentId) => console.log("Delete comment:", commentId)}
        onAddReaction={(commentId, emoji) => console.log("Add reaction:", commentId, emoji)}
        onRemoveReaction={(commentId, reactionId) => console.log("Remove reaction:", commentId, reactionId)}
        createdBy={mockPeople[0] || null}
        createdAt={new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)} // 21 days ago
        subscriptions={subscriptions}
        onDelete={() => setIsDeleted(true)}
        description={description}
        onDescriptionChange={async (newDescription) => {
          setDescription(newDescription);
          return true;
        }}
        richTextHandlers={createMockRichEditorHandlers()}
        formattedTimePreferences={defaultFormattedTimePreferences}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};

function TemplateMilestoneStory({
  milestoneId,
  archived = false,
  dueOffsetDays,
  description,
  emptyTasks = false,
}: {
  milestoneId: string;
  archived?: boolean;
  dueOffsetDays?: number | null;
  description?: any;
  emptyTasks?: boolean;
}) {
  const milestone = sampleTemplateMilestones.find((item) => item.id === milestoneId)!;
  const personSearch = usePersonFieldSearch(mockPeople);
  const richTextHandlers = createMockRichEditorHandlers();
  const [title, setTitle] = useState(milestone.title);
  const [milestoneDescription, setMilestoneDescription] = useState(description ?? milestone.description);
  const [offsetDays, setOffsetDays] = useState<number | null>(
    dueOffsetDays === undefined ? milestone.dueOffsetDays : dueOffsetDays,
  );
  const [isDeleted, setIsDeleted] = useState(false);
  const { tasks, onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder, getTemplateTaskPageProps } =
    useMockTemplateMilestoneTaskActions({
      milestoneId,
      initialTasks: emptyTasks ? [] : createSampleTemplateTasks(milestoneId),
    });

  if (isDeleted) return <div className="p-6 text-content-subtle">Milestone deleted.</div>;

  const props: MilestonePage.TemplateProps = {
    variant: "project-template",
    ...templateStoryContext,
    template: { ...templateStoryContext.template, archived },
    tasksCount: tasks.length,
    milestoneId,
    title,
    onMilestoneTitleChange: async (nextTitle) => {
      setTitle(nextTitle);
      return true;
    },
    description: milestoneDescription,
    onDescriptionChange: async (nextDescription) => {
      setMilestoneDescription(nextDescription);
      return true;
    },
    dueOffsetDays: offsetDays,
    onDueOffsetDaysChange: setOffsetDays,
    tasks,
    statuses: templateStatuses,
    milestones: sampleTemplateMilestones,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    personSearch,
    getTemplateTaskPageProps,
    permissions: generatePermissions(!archived),
    onDelete: () => setIsDeleted(true),
    richTextHandlers,
    formattedTimePreferences: defaultFormattedTimePreferences,
    localDraftKeyBase: `template-milestone:${milestoneId}`,
    updateTemplateName: async (name) => {
      console.log("Template renamed:", name);
      return true;
    },
  };

  return <MilestonePage {...props} />;
}

export const TemplateMilestone: Story = {
  render: () => <TemplateMilestoneStory milestoneId="beta" />,
};

export const TemplateEmptyMilestone: Story = {
  render: () => (
    <TemplateMilestoneStory milestoneId="launch" dueOffsetDays={21} description={null} emptyTasks />
  ),
};

export const TemplateArchivedMilestone: Story = {
  render: () => <TemplateMilestoneStory milestoneId="beta" archived />,
};
