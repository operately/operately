import type { Meta, StoryObj } from "@storybook/react";
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

const DEFAULT_STATUS_OPTIONS: StatusSelector.StatusOption[] = [
  { id: "pending", value: "pending", label: "Not started", color: "gray", icon: "circleDashed", index: 0 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "blocked", value: "blocked", label: "Blocked", color: "red", icon: "circleX", index: 2 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 3 },
];

const meta: Meta<typeof TaskPage> = {
  title: "Pages/TaskPage",
  component: TaskPage,
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => <Component {...args} />,
} satisfies Meta<typeof TaskPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function Component(props: Partial<TaskPage.Props>) {
  const [name, setName] = React.useState(props.name || "");
  const [description, setDescription] = React.useState(props.description || null);

  // Normalize incoming status prop (which the stories provide as a string)
  // into a full StatusSelector.StatusOption for TaskPage/StatusSelector.
  const initialStatusOption = React.useMemo(() => {
    const baseOptions = props.statusOptions ?? DEFAULT_STATUS_OPTIONS;

    if (props.status && typeof (props.status as any) === "object") {
      return props.status as any;
    }

    const key = (props.status as any) || "pending";
    return baseOptions.find((s) => s.value === key || s.id === key) ?? baseOptions[0];
  }, [props.status, props.statusOptions]);

  const [status, setStatus] = React.useState<typeof initialStatusOption | null>(initialStatusOption);
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | undefined>(props.dueDate);
  const [assignee, setAssignee] = React.useState(props.assignee || null);
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

    // Navigation
    projectName: props.projectName ?? "Mobile App V2",
    projectStatus: props.projectStatus ?? "on_track",
    projectLink: "#",
    workmapLink: "#",

    space: {
      id: "space-123",
      name: "Product",
      link: "#"
    },

    childrenCount: {
      tasksCount: 5,
      discussionsCount: 3,
      checkInsCount: 2,
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

    status: status as any,
    onStatusChange: (newStatus) => {
      console.log("Updating task status:", newStatus);
      setStatus(newStatus as any);
    },

    dueDate: dueDate,
    onDueDateChange: (newDate) => {
      console.log("Updating due date:", newDate);
      setDueDate(newDate ?? undefined);
    },

    assignee,
    onAssigneeChange: (newAssignee) => {
      setAssignee(newAssignee);
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
    status: "in_progress",
    dueDate: createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"),
    assignee: mockTaskPeople[0]!,
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
    status: "pending",
    milestone: undefined,
    dueDate: undefined,
    assignee: null,
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
    status: "done",
    dueDate: createContextualDate(new Date(2024, 0, 10), "day"),
    assignee: mockTaskPeople[3]!,
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
    status: "in_progress",
    dueDate: createContextualDate(new Date(2024, 0, 5), "day"),
    assignee: mockTaskPeople[0]!,
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
    status: "pending",
    dueDate: createContextualDate(new Date(2024, 3, 1), "day"),
    assignee: mockTaskPeople[1]!,
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
