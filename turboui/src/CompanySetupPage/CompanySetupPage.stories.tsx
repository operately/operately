import type { Meta, StoryObj } from "@storybook/react";
import { CompanySetupPage } from "./index";

const meta: Meta<typeof CompanySetupPage> = {
  title: "Pages/CompanySetupPage",
  component: CompanySetupPage,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    inviteTeamCompleted: {
      control: "boolean",
      description: "Whether the invite team step is completed",
    },
    spacesCompleted: {
      control: "boolean",
      description: "Whether the spaces setup step is completed",
    },
    projectsCompleted: {
      control: "boolean",
      description: "Whether the projects step is completed",
    },
    onInviteTeam: {
      action: "onInviteTeam",
      description: "Callback when invite team button is clicked",
    },
    onCreateSpaces: {
      action: "onCreateSpace",
      description: "Callback when create space button is clicked",
    },
    onAddProject: {
      action: "okinBrowseWork",
      description: "Callback when browse work button is clicked",
    },
    name: {
      control: "text",
      description: "User's name for personalized greeting",
    },
    bookDemoUrl: {
      control: "text",
      description: "Calendly URL for booking demo sessions",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompanySetupPage>;

export const Default: Story = {
  args: {
    inviteTeamCompleted: false,
    spacesCompleted: false,
    projectsCompleted: false,
    name: "John",
    bookDemoUrl: "https://calendly.com/ceo/onboarding-session",
    discordUrl: "https://discord.gg/operately",
  },
};

export const OneCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: false,
    projectsCompleted: false,
    name: "Sarah",
    bookDemoUrl: "https://calendly.com/ceo/onboarding-session",
    discordUrl: "https://discord.gg/operately",
  },
};

export const TwoCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: true,
    projectsCompleted: false,
    name: "Michael",
    bookDemoUrl: "https://calendly.com/ceo/onboarding-session",
    discordUrl: "https://discord.gg/operately",
  },
};

export const AllCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: true,
    projectsCompleted: true,
    name: "Emma",
    bookDemoUrl: "https://calendly.com/ceo/onboarding-session",
    discordUrl: "https://discord.gg/operately",
  },
};

// Story for testing responsive behavior
export const MobileView: Story = {
  args: {
    inviteTeamCompleted: false,
    spacesCompleted: true,
    projectsCompleted: false,
    name: "Alex",
    bookDemoUrl: "https://calendly.com/ceo/onboarding-session",
    discordUrl: "https://discord.gg/operately",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
