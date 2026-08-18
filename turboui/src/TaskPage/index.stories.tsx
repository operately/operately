import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { TaskPage } from ".";
import { InProjectContextStory } from "./InProjectContextStory";
import { DateField } from "../DateField";
import {
  mockTaskPeople,
  mockMilestones,
  asRichText,
  asRichTextWithList,
  createActiveTaskTimeline,
  createMinimalTaskTimeline,
  createCompletedTaskTimeline,
  createOverdueTaskTimeline,
  createLongContentTimeline,
  currentUser,
} from "./mockData";
import { createContextualDate } from "../DateField/mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import { StatusSelector } from "../StatusSelector";
import { generatePermissions } from "../utils/storybook/permissions";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { sampleTemplateMilestones, templateStatuses } from "../MilestonePage/templateMockData";
import { TaskSlideIn } from "../TaskBoard/KanbanView/TaskSlideIn";

const DEFAULT_STATUS_OPTIONS: StatusSelector.StatusOption[] = [
  { id: "pending", value: "pending", label: "Not started", color: "gray", icon: "circleDashed", index: 0 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "blocked", value: "blocked", label: "Blocked", color: "red", icon: "circleX", index: 2 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 3 },
];

const PENDING_STATUS = DEFAULT_STATUS_OPTIONS[0]!;
const IN_PROGRESS_STATUS = DEFAULT_STATUS_OPTIONS[1]!;
const DONE_STATUS = DEFAULT_STATUS_OPTIONS[3]!;

const meta: Meta<typeof TaskPage> = {
  title: "Pages/TaskPage",
  component: TaskPage,
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => <Component {...args} />,
} satisfies Meta<typeof TaskPage>;

export default meta;
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: Partial<TaskPage.Props>;
};

function Component(props: Partial<TaskPage.Props>) {
  const [name, setName] = React.useState(props.name || "");
  const [description, setDescription] = React.useState(props.description || null);

  const initialStatusOption = React.useMemo(() => {
    const baseOptions = props.statusOptions ?? DEFAULT_STATUS_OPTIONS;
    if (!props.status) return baseOptions[0];

    return baseOptions.find((option) => option.value === props.status?.value || option.id === props.status?.id) ?? props.status;
  }, [props.status, props.statusOptions]);

  const [status, setStatus] = React.useState<typeof initialStatusOption | null>(initialStatusOption);
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | undefined>(props.dueDate);
  const [reminders, setReminders] = React.useState<TaskPage.Reminder[]>(
    props.reminders ?? [{ type: "before_due", days: 1, date: null }],
  );
  const [assignees, setAssignees] = React.useState(props.assignees || []);
  const [milestone, setMilestone] = React.useState<TaskPage.Milestone | null>(props.milestone || null);
  const [milestones, setMilestones] = React.useState<TaskPage.Milestone[]>(mockMilestones);
  const searchData = usePersonFieldSearch(mockTaskPeople);
  const mockSubscriptions = useMockSubscriptions({
    entityType: "project_task",
    initial: props.subscriptions?.isSubscribed ?? true,
  });

  const handleMilestoneSearch = React.useCallback(async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

    const filtered = mockMilestones.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
    setMilestones(filtered);
  }, []);

  // Destructure to exclude milestone and onMilestoneChange from props
  const { milestone: _ignoredMilestone, onMilestoneChange: _ignoredOnMilestoneChange, ...restProps } = props;

  const defaults: TaskPage.Props = {
    ...restProps,
    variant: props.variant ?? "project-task",

    // Navigation
    projectName: props.projectName ?? "Mobile App V2",
    projectStatus: props.projectStatus ?? "on_track",
    projectLink: "#",
    workmapLink: "#",

    space: {
      id: "space-123",
      name: "Product",
      link: "#",
    },

    childrenCount: {
      tasksCount: 5,
      discussionsCount: 3,
      checkInsCount: 2,
      docsAndFilesCount: 0,
    },

    closedAt: null,
    updateProjectName: async (name: string) => {
      console.log("Updating project name:", name);
      return true;
    },

    // Core data - use local state
    name: name,
    onNameChange: async (newName: string) => {
      console.log("Updating task name:", newName);
      setName(newName);
      return true;
    },

    description: description,
    onDescriptionChange: async (newDescription: any) => {
      console.log("Updating task description:", newDescription);
      setDescription(newDescription);
      return true;
    },

    status: status ?? null,
    onStatusChange: (newStatus) => {
      console.log("Updating task status:", newStatus);
      setStatus(newStatus);
    },

    dueDate: dueDate,
    onDueDateChange: (newDate) => {
      console.log("Updating due date:", newDate);
      setDueDate(newDate ?? undefined);
    },
    reminders,
    onRemindersChange: (newReminders) => {
      console.log("Updating reminders:", newReminders);
      setReminders(newReminders);
      return true;
    },

    assignees,
    onAssigneesChange: (newAssignees) => {
      setAssignees(newAssignees);
    },

    // Milestone - use local state only
    milestone: milestone,
    onMilestoneChange: (newMilestone) => {
      console.log("Updating milestone:", newMilestone);
      setMilestone(newMilestone);
    },
    milestones: milestones,
    onMilestoneSearch: handleMilestoneSearch,

    // Subscription
    subscriptions: props.subscriptions ?? mockSubscriptions,

    // Metadata
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // One week ago
    createdBy: mockTaskPeople[0]!,

    // Actions
    onDelete: async () => {
      console.log("Deleting task");
      return Promise.resolve();
    },

    onDuplicate: () => {
      console.log("Duplicating task");
    },

    onArchive: () => {
      console.log("Archiving task");
    },

    // Assignee search data
    assigneePersonSearch: searchData,
    richTextHandlers: createMockRichEditorHandlers(),

    // Permissions
    permissions: generatePermissions(true),
    canEdit: true,

    // Timeline data
    timelineItems: props.timelineItems || [],
    currentUser: currentUser,
    canComment: true,
    onAddComment: (content: any) => {
      console.log("Add comment:", content);
    },
    onEditComment: (id: string, content: any) => {
      console.log("Edit comment:", id, content);
    },
    onDeleteComment: (id: string) => {
      console.log("Delete comment:", id);
    },
    onAddReaction: (commentId: string, emoji: string) => {
      console.log("Add reaction:", commentId, emoji);
    },
    onRemoveReaction: (commentId: string, reactionId: string) => {
      console.log("Remove reaction:", commentId, reactionId);
    },

    formattedTimePreferences: defaultFormattedTimePreferences,
    statusOptions: props.statusOptions ?? DEFAULT_STATUS_OPTIONS,
  };

  return <TaskPage {...defaults} />;
}

/**
 * Default TaskPage with complete data
 */
export const Default: Story = {
  args: {
    name: "Implement user authentication flow",
    description: asRichTextWithList(
      ["We need to implement a complete user authentication flow for the mobile app including:"],
      [
        "Login with email/password",
        "Social login (Google, Apple)",
        "Password reset functionality",
        "Two-factor authentication",
      ],
    ),
    status: IN_PROGRESS_STATUS,
    dueDate: createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"),
    assignees: [mockTaskPeople[0]!],
    milestone: mockMilestones[1], // Beta Release
    timelineItems: createActiveTaskTimeline(),
  },
};

/**
 * Task with minimal data - no project, milestone, assignee, or due date
 */
export const MinimalTask: Story = {
  args: {
    name: "Review API documentation",
    description: null,
    status: PENDING_STATUS,
    milestone: undefined,
    dueDate: undefined,
    assignees: [],
    timelineItems: createMinimalTaskTimeline(),
  },
};

/**
 * Completed task
 */
export const CompletedTask: Story = {
  args: {
    name: "Set up CI/CD pipeline",
    description: asRichTextWithList(
      ["Configured automated deployment pipeline with the following stages:"],
      [
        "Automated testing on PR creation",
        "Security scanning",
        "Staging deployment",
        "Production deployment with approval",
      ],
    ),
    status: DONE_STATUS,
    dueDate: createContextualDate(new Date(2024, 0, 10), "day"),
    assignees: [mockTaskPeople[3]!],
    milestone: mockMilestones[0], // MVP Launch (completed)
    timelineItems: createCompletedTaskTimeline(),
  },
};

/**
 * Overdue task
 */
export const OverdueTask: Story = {
  args: {
    name: "Fix critical security vulnerability",
    description: asRichText("Critical security issue found in authentication module. Needs immediate attention. 🚨"),
    status: IN_PROGRESS_STATUS,
    dueDate: createContextualDate(new Date(2024, 0, 5), "day"),
    assignees: [mockTaskPeople[0]!],
    timelineItems: createOverdueTaskTimeline(),
  },
};

/**
 * Long content task to test text handling
 */
export const LongContent: Story = {
  args: {
    name: "This is a very long task name that might wrap to multiple lines and we want to see how it handles the layout and visual hierarchy when the text is quite extensive",
    description: asRichTextWithList(
      [
        "This is a very long description that contains a lot of content to test how the component handles lengthy text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
      ],
      [
        "This is a very long bullet point that contains extensive information about a particular aspect of the task",
        "Another lengthy bullet point with detailed explanations and specifications",
        "Yet another comprehensive bullet point with thorough documentation",
      ],
    ),
    status: PENDING_STATUS,
    dueDate: createContextualDate(new Date(2024, 3, 1), "day"),
    assignees: [mockTaskPeople[1]!],
    milestone: mockMilestones[3], // Performance Optimization
    timelineItems: createLongContentTimeline(),
  },
};

/**
 * TaskPage shown within a project context with header and tabs
 */
export const InProjectContext: Story = {
  render: () => <InProjectContextStory />,
  parameters: {
    layout: "fullscreen",
  },
};

function TemplateTaskContentStory({
  canEdit = true,
  description = null,
}: {
  canEdit?: boolean;
  description?: any;
}) {
  const personSearch = usePersonFieldSearch(mockTaskPeople);
  const [name, setName] = React.useState("Publish announcement");
  const [taskDescription, setTaskDescription] = React.useState(description);
  const [status, setStatus] = React.useState(templateStatuses[0]!);
  const [dueOffsetDays, setDueOffsetDays] = React.useState<number | null>(21);
  const [milestone, setMilestone] = React.useState<TaskPage.Milestone | null>({
    id: "launch",
    name: "Public launch",
    dueDate: null,
    status: "pending",
  });
  const [assignees, setAssignees] = React.useState<TaskPage.Person[]>([
    { id: "ada", fullName: "Ada Lovelace", avatarUrl: null, profileLink: "#" },
  ]);

  const contentProps: TaskPage.ContentProps = {
    variant: "template",
    name,
    onNameChange: async (nextName) => {
      setName(nextName);
      return true;
    },
    description: taskDescription,
    onDescriptionChange: async (nextDescription) => {
      setTaskDescription(nextDescription);
      return true;
    },
    status,
    onStatusChange: setStatus,
    statusOptions: templateStatuses,
    dueDate: undefined,
    onDueDateChange: () => undefined,
    dueOffsetDays,
    onDueOffsetDaysChange: setDueOffsetDays,
    reminders: [],
    onRemindersChange: async () => true,
    milestone,
    onMilestoneChange: setMilestone,
    milestones: sampleTemplateMilestones.map((item) => ({
      id: item.id,
      name: item.title,
      dueDate: null,
      status: "pending",
    })),
    onMilestoneSearch: async () => undefined,
    assignees,
    onAssigneesChange: setAssignees,
    createdAt: new Date(),
    createdBy: null,
    subscriptions: {
      isSubscribed: false,
      hidden: true,
      entityType: "project_task",
      subscribedPeople: [],
      onToggle: () => undefined,
    },
    onDelete: async () => undefined,
    assigneePersonSearch: personSearch,
    richTextHandlers: createMockRichEditorHandlers(),
    canEdit,
    onAddComment: () => undefined,
    onEditComment: () => undefined,
    onDeleteComment: () => undefined,
    formattedTimePreferences: defaultFormattedTimePreferences,
  };

  return <TaskSlideIn isOpen onClose={() => undefined} taskPageProps={contentProps} />;
}

export const TemplateTask: Story = {
  render: () => <TemplateTaskContentStory />,
  parameters: { layout: "fullscreen" },
};

export const TemplateTaskReadonly: Story = {
  render: () => <TemplateTaskContentStory canEdit={false} description={asRichText("Finalize launch messaging.")} />,
  parameters: { layout: "fullscreen" },
};
