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
    onCreateSpace: {
      action: "onCreateSpace",
      description: "Callback when create space button is clicked",
    },
    onBrowseWork: {
      action: "onBrowseWork",
      description: "Callback when browse work button is clicked",
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
  },
};

export const OneCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: false,
    projectsCompleted: false,
  },
};

export const TwoCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: true,
    projectsCompleted: false,
  },
};

export const AllCompleted: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: true,
    projectsCompleted: true,
  },
};

// Story for testing responsive behavior
export const MobileView: Story = {
  args: {
    inviteTeamCompleted: false,
    spacesCompleted: true,
    projectsCompleted: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const DarkModePreview: Story = {
  args: {
    inviteTeamCompleted: true,
    spacesCompleted: false,
    projectsCompleted: false,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};
