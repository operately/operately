import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskPage } from ".";
import { InProjectContextStory } from "./InProjectContextStory";
import { DateField } from "../DateField";
import {
  mockTaskPeople,
  mockMilestones,
  searchTaskPeople,
  searchMilestones,
  searchRichEditorPeople,
  mockMentionedPersonLookup,
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
  const [status, setStatus] = React.useState(props.status || "pending");
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | undefined>(props.dueDate);
  const [assignee, setAssignee] = React.useState(props.assignee || null);
  const [milestone, setMilestone] = React.useState<TaskPage.Milestone | null>(props.milestone || null);
  const [isSubscribed, setIsSubscribed] = React.useState(props.isSubscribed ?? true);

  // Destructure to exclude milestone and onMilestoneChange from props
  const { milestone: _ignoredMilestone, onMilestoneChange: _ignoredOnMilestoneChange, ...restProps } = props;

  const defaults: TaskPage.Props = {
    ...restProps,

    // Navigation
    projectName: props.projectName ?? "Mobile App V2",
    projectLink: "#",
    workmapLink: "#",

    space: {
      id: "space-123",
      name: "Product",
      link: "#"
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
      setStatus(newStatus);
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

    // Subscription
    isSubscribed: isSubscribed,
    onSubscriptionToggle: (subscribed) => {
      console.log("Toggling subscription:", subscribed);
      setIsSubscribed(subscribed);
    },

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

    // Search
    searchPeople: searchTaskPeople,
    searchMilestones: searchMilestones,
    peopleSearch: searchRichEditorPeople,
    mentionedPersonLookup: mockMentionedPersonLookup,

    // Permissions
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
    status: "pending",
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
    status: "done",
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
    status: "in_progress",
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
    status: "pending",
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
