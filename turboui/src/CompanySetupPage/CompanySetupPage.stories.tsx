import type { Meta, StoryObj } from "@storybook/react";
import { CompanySetupPage } from "./index";

const meta: Meta<typeof CompanySetupPage> = {
  title: "Pages/CompanySetupPage",
  component: CompanySetupPage,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    title: {
      control: "text",
      description: "Main title of the setup page",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle providing additional context",
    },
    setupItems: {
      control: "object",
      description: "Array of setup items to display",
    },
    navigation: {
      control: "object",
      description: "Optional navigation breadcrumbs",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompanySetupPage>;

// Mock setup items for stories
const createSetupItems = (completedItems: string[] = []) => [
  {
    id: "invite-team",
    title: "Invite your team",
    description: "Get your colleagues onboard and start collaborating together.",
    linkTo: "/people",
    linkText: "Invite team members",
    isCompleted: completedItems.includes("invite-team"),
    testId: "setup-invite-team",
  },
  {
    id: "create-spaces",
    title: "Set up Spaces",
    description: "Create organized spaces for different teams, departments, or initiatives.",
    linkTo: "/spaces/new",
    linkText: "Create a space",
    isCompleted: completedItems.includes("create-spaces"),
    testId: "setup-create-space",
  },
  {
    id: "add-projects",
    title: "Add your first project",
    description: "Start tracking progress on your most important work.",
    linkTo: "/work-map",
    linkText: "Browse work",
    isCompleted: completedItems.includes("add-projects"),
    testId: "setup-add-project",
  },
];

export const Default: Story = {
  args: {
    title: "Let's set up your company!",
    subtitle: "Complete these steps to get your team organized and productive.",
    setupItems: createSetupItems(),
  },
};

export const WithNavigation: Story = {
  args: {
    title: "Let's set up Acme Corp!",
    subtitle: "Complete these steps to get your team organized and productive.",
    setupItems: createSetupItems(),
    navigation: [
      { to: "/", label: "Home" },
      { to: "/setup", label: "Company Setup" },
    ],
  },
};

export const NoSubtitle: Story = {
  args: {
    title: "Company Setup",
    setupItems: createSetupItems(),
  },
};

export const OneItemCompleted: Story = {
  args: {
    title: "Let's set up your company!",
    subtitle: "Great progress! Keep going to finish setting up your workspace.",
    setupItems: createSetupItems(["invite-team"]),
  },
};

export const TwoItemsCompleted: Story = {
  args: {
    title: "Let's set up your company!",
    subtitle: "You're almost done! Just one more step to complete your setup.",
    setupItems: createSetupItems(["invite-team", "create-spaces"]),
  },
};

export const AllCompleted: Story = {
  args: {
    title: "Setup Complete! 🎉",
    subtitle: "Congratulations! Your company is fully set up and ready to go.",
    setupItems: createSetupItems(["invite-team", "create-spaces", "add-projects"]),
  },
};

export const LongContent: Story = {
  args: {
    title: "Let's set up your company with a very long title that might wrap to multiple lines!",
    subtitle:
      "This is a much longer subtitle that provides extensive context and detailed information about what the user needs to do to complete their company setup process successfully.",
    setupItems: [
      {
        id: "invite-team",
        title: "Invite your team members to collaborate",
        description:
          "Get your colleagues onboard and start collaborating together. This includes sending invitations, setting up user roles, and ensuring everyone has the right permissions to access the tools they need.",
        linkTo: "/people",
        linkText: "Invite team members",
        isCompleted: false,
        testId: "setup-invite-team",
      },
      {
        id: "create-spaces",
        title: "Set up organized workspaces and project spaces",
        description:
          "Create organized spaces for different teams, departments, or initiatives. This helps keep work organized and ensures that team members can easily find and contribute to the projects that matter most.",
        linkTo: "/spaces/new",
        linkText: "Create a space",
        isCompleted: true,
        testId: "setup-create-space",
      },
      {
        id: "add-projects",
        title: "Add your first project and start tracking progress",
        description:
          "Start tracking progress on your most important work. Projects help you organize tasks, set deadlines, and monitor progress toward your goals.",
        linkTo: "/work-map",
        linkText: "Browse work",
        isCompleted: false,
        testId: "setup-add-project",
      },
    ],
  },
};

export const MinimalSetup: Story = {
  args: {
    title: "Quick Setup",
    setupItems: [
      {
        id: "single-task",
        title: "Complete your profile",
        description: "Add your details to get started.",
        linkTo: "/profile",
        linkText: "Edit profile",
        isCompleted: false,
        testId: "setup-profile",
      },
    ],
  },
};

export const ManyItems: Story = {
  args: {
    title: "Comprehensive Company Setup",
    subtitle: "Complete all these steps for the best experience.",
    setupItems: [
      {
        id: "profile",
        title: "Complete your profile",
        description: "Add your personal information and profile picture.",
        linkTo: "/profile",
        linkText: "Edit profile",
        isCompleted: true,
        testId: "setup-profile",
      },
      {
        id: "invite-team",
        title: "Invite your team",
        description: "Get your colleagues onboard and start collaborating together.",
        linkTo: "/people",
        linkText: "Invite team members",
        isCompleted: true,
        testId: "setup-invite-team",
      },
      {
        id: "create-spaces",
        title: "Set up Spaces",
        description: "Create organized spaces for different teams, departments, or initiatives.",
        linkTo: "/spaces/new",
        linkText: "Create a space",
        isCompleted: false,
        testId: "setup-create-space",
      },
      {
        id: "add-projects",
        title: "Add your first project",
        description: "Start tracking progress on your most important work.",
        linkTo: "/work-map",
        linkText: "Browse work",
        isCompleted: false,
        testId: "setup-add-project",
      },
      {
        id: "set-goals",
        title: "Define company goals",
        description: "Set clear objectives and key results for your organization.",
        linkTo: "/goals/new",
        linkText: "Create goals",
        isCompleted: false,
        testId: "setup-goals",
      },
      {
        id: "configure-notifications",
        title: "Configure notifications",
        description: "Set up how and when you want to receive updates.",
        linkTo: "/notifications",
        linkText: "Manage notifications",
        isCompleted: false,
        testId: "setup-notifications",
      },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    title: "No Setup Required",
    subtitle: "Everything is already configured for your company.",
    setupItems: [],
  },
};

export const DarkModePreview: Story = {
  args: {
    title: "Let's set up your company!",
    subtitle: "Complete these steps to get your team organized and productive.",
    setupItems: createSetupItems(["invite-team"]),
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

// Story for testing responsive behavior
export const MobileView: Story = {
  args: {
    title: "Let's set up your company!",
    subtitle: "Complete these steps to get your team organized and productive.",
    setupItems: createSetupItems(["create-spaces"]),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
