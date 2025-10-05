import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompanySetupStepsReminder } from "./index";

const meta: Meta<typeof CompanySetupStepsReminder> = {
  title: "Pages/CompanySetupPage/CompanySetupStepsReminder",
  component: CompanySetupStepsReminder,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    hasTeamMembers: {
      control: "boolean",
      description: "Whether the company has team members added",
    },
    hasSpaces: {
      control: "boolean",
      description: "Whether the company has spaces created",
    },
    hasProjects: {
      control: "boolean",
      description: "Whether the company has projects started",
    },
    continuePath: {
      control: "text",
      description: "Path to navigate to when Continue Setup is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompanySetupStepsReminder>;

export const NoSetupDone: Story = {
  args: {
    hasTeamMembers: false,
    hasSpaces: false,
    hasProjects: false,
    continuePath: "/setup",
  },
};

export const TeamMembersAdded: Story = {
  args: {
    hasTeamMembers: true,
    hasSpaces: false,
    hasProjects: false,
    continuePath: "/setup",
  },
};

export const SpacesCreated: Story = {
  args: {
    hasTeamMembers: true,
    hasSpaces: true,
    hasProjects: false,
    continuePath: "/setup",
  },
};

export const AllButProjectsDone: Story = {
  args: {
    hasTeamMembers: true,
    hasSpaces: true,
    hasProjects: false,
    continuePath: "/setup",
  },
  parameters: {
    docs: {
      description: {
        story: "Shows the final step when only projects need to be started",
      },
    },
  },
};

export const CustomPath: Story = {
  args: {
    hasTeamMembers: false,
    hasSpaces: false,
    hasProjects: false,
    continuePath: "/custom-setup-path",
  },
  parameters: {
    docs: {
      description: {
        story: "Example with a custom continue path",
      },
    },
  },
};
