import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskPage } from ".";

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

// Mock people data for TaskPage (simplified Person interface)
const mockTaskPeople: TaskPage.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Mock milestone data for TaskPage - sorted by due date (earliest first), with some without due dates
const mockMilestones: TaskPage.Milestone[] = [
  {
    id: "milestone-2",
    title: "MVP Launch",
    dueDate: new Date(2024, 0, 30), // January 30, 2024 (earliest)
    status: "complete",
    projectLink: "/projects/mobile-app/milestones/mvp",
  },
  {
    id: "milestone-1",
    title: "Beta Release",
    dueDate: new Date(2024, 1, 15), // February 15, 2024
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/beta",
  },
  {
    id: "milestone-3",
    title: "User Testing Phase",
    dueDate: new Date(2024, 2, 10), // March 10, 2024
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/testing",
  },
  {
    id: "milestone-4",
    title: "Performance Optimization",
    dueDate: new Date(2024, 3, 5), // April 5, 2024
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/performance",
  },
  {
    id: "milestone-5",
    title: "Code Review Process",
    // No due date
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/code-review",
  },
  {
    id: "milestone-6",
    title: "Documentation Update",
    // No due date
    status: "pending",
    projectLink: "/projects/mobile-app/milestones/docs",
  },
];

// Mock people data for RichEditor SearchFn (extended Person interface)
const mockRichEditorPeople = [
  {
    id: "user-1",
    fullName: "Alice Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    title: "Senior Developer",
    profileLink: "/people/alice",
  },
  {
    id: "user-2",
    fullName: "Bob Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
    title: "Product Manager",
    profileLink: "/people/bob",
  },
  {
    id: "user-3",
    fullName: "Charlie Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=charlie",
    title: "Designer",
    profileLink: "/people/charlie",
  },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null, title: "QA Engineer", profileLink: "/people/diana" },
];

// Mock search function for TaskPage assignees
const searchTaskPeople = async ({ query }: { query: string }): Promise<TaskPage.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockTaskPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Mock search function for TaskPage milestones - maintains earliest first sorting
const searchMilestones = async ({ query }: { query: string }): Promise<TaskPage.Milestone[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  
  const filtered = mockMilestones.filter((milestone) => 
    milestone.title.toLowerCase().includes(query.toLowerCase())
  );
  
  // Sort by due date (earliest first), then by title for those without due dates
  return filtered.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (a.dueDate && !b.dueDate) return -1; // Items with due dates come first
    if (!a.dueDate && b.dueDate) return 1;
    return a.title.localeCompare(b.title); // Alphabetical for no due dates
  });
};

// Mock search function for RichEditor mentions
const searchRichEditorPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockRichEditorPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Mock mentioned person lookup function
const mockMentionedPersonLookup = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API delay
  return mockRichEditorPeople.find((person) => person.id === id) || null;
};

// Helper function to convert text to rich content JSON format
function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}

// Helper function for complex rich content with lists
function asRichTextWithList(paragraphs: string[], listItems: string[]): any {
  const content: any[] = [];

  // Add paragraphs
  paragraphs.forEach((text) => {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text }],
    });
  });

  // Add bullet list
  if (listItems.length > 0) {
    content.push({
      type: "bulletList",
      content: listItems.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      })),
    });
  }

  return {
    type: "doc",
    content,
  };
}

function Component(props: Partial<TaskPage.Props>) {
  const [name, setName] = React.useState(props.name || "");
  const [description, setDescription] = React.useState(props.description || null);
  const [status, setStatus] = React.useState(props.status || "pending");
  const [dueDate, setDueDate] = React.useState<Date | undefined>(props.dueDate);
  const [assignees, setAssignees] = React.useState<TaskPage.Person[]>(props.assignees || []);
  const [milestone, setMilestone] = React.useState<TaskPage.Milestone | null>(props.milestone || null);
  const [isSubscribed, setIsSubscribed] = React.useState(props.isSubscribed ?? true);

  // Destructure to exclude milestone and onMilestoneChange from props
  const { milestone: _ignoredMilestone, onMilestoneChange: _ignoredOnMilestoneChange, ...restProps } = props;

  const defaults: TaskPage.Props = {
    ...restProps,

    // Navigation
    spaceLink: "/spaces/product",
    spaceName: "Product",
    projectLink: props.projectLink ?? "/projects/mobile-app",
    projectName: props.projectName ?? "Mobile App V2",
    // Clear legacy milestone props when milestone is null to prevent fallback
    milestoneLink: milestone ? (props.milestoneLink ?? "/milestones/beta-release") : undefined,
    milestoneName: milestone ? (props.milestoneName ?? "Beta Release") : undefined,

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

    assignees: assignees,
    onAssigneesChange: (newAssignees) => {
      console.log("Updating assignees:", newAssignees);
      setAssignees(newAssignees);
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
    onCopyUrl: () => {
      console.log("Copying URL to clipboard");
      navigator.clipboard?.writeText(window.location.href);
    },

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
    onCreateMilestone: (title?: string) => {
      console.log("Creating new milestone with title:", title);
      // In a real app, this would open a modal or navigate to milestone creation
      // For Storybook demo purposes, we'll create a simple milestone to show the interaction
      if (title) {
        const newMilestone: TaskPage.Milestone = {
          id: `milestone-${Date.now()}`,
          title: title,
          status: "pending",
          projectLink: "/projects/demo",
        };
        setMilestone(newMilestone);
      }
    },
    peopleSearch: searchRichEditorPeople,
    mentionedPersonLookup: mockMentionedPersonLookup,

    // Permissions
    canEdit: true,
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
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    assignees: [mockTaskPeople[0]!],
    milestone: mockMilestones[1], // Beta Release
  },
};

/**
 * Task with minimal data - no project, milestone, assignee, or due date
 */
export const MinimalTask: Story = {
  render: (args) => {
    const [name, setName] = React.useState(args.name || "");
    const [description, setDescription] = React.useState(args.description || null);
    const [status, setStatus] = React.useState(args.status || "pending");
    const [dueDate, setDueDate] = React.useState<Date | undefined>(args.dueDate);
    const [assignees, setAssignees] = React.useState<TaskPage.Person[]>(args.assignees || []);
    const [milestone, setMilestone] = React.useState<TaskPage.Milestone | null>(() => args.milestone ?? null);
    const [isSubscribed, setIsSubscribed] = React.useState(args.isSubscribed ?? true);

    // Mock search that returns no milestones (empty array)
    const searchMilestones = async (): Promise<TaskPage.Milestone[]> => {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
      return []; // No milestones available
    };

    const defaults: TaskPage.Props = {
      ...args,

      // Navigation
      spaceLink: "/spaces/product",
      spaceName: "Product",
      projectLink: undefined,
      projectName: undefined,
      milestoneLink: undefined,
      milestoneName: undefined,

      // Core data
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

      assignees: assignees,
      onAssigneesChange: (newAssignees) => {
        console.log("Updating assignees:", newAssignees);
        setAssignees(newAssignees);
      },

      milestone: milestone,
      onMilestoneChange: (newMilestone) => {
        console.log("Updating milestone:", newMilestone);
        setMilestone(newMilestone);
      },

      // Metadata
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // One week ago
      createdBy: mockTaskPeople[0]!,

      // Subscription
      isSubscribed: isSubscribed,
      onSubscriptionToggle: (subscribed) => {
        console.log("Toggling subscription:", subscribed);
        setIsSubscribed(subscribed);
      },

      // Actions
      onCopyUrl: () => {
        console.log("Copying URL to clipboard");
        navigator.clipboard?.writeText(window.location.href);
      },

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

      // Search - no milestones available
      searchPeople: searchTaskPeople,
      searchMilestones: searchMilestones,
      onCreateMilestone: (title?: string) => {
        console.log("Creating new milestone from minimal task with title:", title);
        // In a real app, this would open a modal or navigate to milestone creation
        // For Storybook demo purposes, we'll create a simple milestone to show the interaction
        if (title) {
          const newMilestone: TaskPage.Milestone = {
            id: `milestone-${Date.now()}`,
            title: title,
            status: "pending",
            projectLink: "/projects/demo",
          };
          setMilestone(newMilestone);
        }
      },
      peopleSearch: searchRichEditorPeople,
      mentionedPersonLookup: mockMentionedPersonLookup,

      // Permissions
      canEdit: true,
    };

    return <TaskPage {...defaults} />;
  },
  args: {
    name: "Review API documentation",
    description: null,
    status: "pending",
    milestone: undefined,
    dueDate: undefined,
    assignees: [],
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
    dueDate: new Date(2024, 0, 10), // January 10, 2024 (completed before due date)
    assignees: [mockTaskPeople[3]!],
    milestone: mockMilestones[0], // MVP Launch (completed)
  },
};

/**
 * Overdue task
 */
export const OverdueTask: Story = {
  args: {
    name: "Fix critical security vulnerability",
    description: asRichText("🚨 Critical security issue found in authentication module. Needs immediate attention."),
    status: "in_progress",
    dueDate: new Date(2024, 0, 5), // January 5, 2024 (overdue)
    assignees: [mockTaskPeople[0]!],
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
    dueDate: new Date(2024, 3, 1), // April 1, 2024
    assignees: [mockTaskPeople[1]!],
    milestone: mockMilestones[3], // Performance Optimization
  },
};

/**
 * Task with milestone selection capabilities showcased
 */
export const MilestoneSelection: Story = {
  args: {
    name: "Optimize database queries",
    description: asRichText("Review and optimize slow database queries identified in performance monitoring."),
    status: "pending",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    assignees: [mockTaskPeople[2]!],
    milestone: mockMilestones[4], // Code Review Process (no due date)
  },
};

/**
 * Read-only task page (canEdit: false) to test milestone field readonly state
 */
export const ReadOnlyTask: Story = {
  args: {
    name: "Test user interface components",
    description: asRichText("Comprehensive testing of all UI components for accessibility and responsiveness."),
    status: "in_progress",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    assignees: [mockTaskPeople[1]!],
    milestone: mockMilestones[2], // User Testing Phase
    canEdit: false,
  },
};

