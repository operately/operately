import type { Meta, StoryObj } from "@storybook/react";

import { CompanyMemberOnboardingWizard } from "./CompanyMemberOnboarding";
import { withMockWorkspaceBackdrop } from "./storyUtils";

const meta = {
  title: "Components/Onboarding/CompanyMemberOnboardingWizard",
  component: CompanyMemberOnboardingWizard,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onComplete: () => {},
    onDismiss: () => {},
    markoImageUrl: "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg",
  },
  decorators: [withMockWorkspaceBackdrop],
} satisfies Meta<typeof CompanyMemberOnboardingWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  args: {
    __initialStep: "welcome",
  },
};

export const Role: Story = {
  args: {
    __initialStep: "role",
  },
};

export const AvatarEmpty: Story = {
  args: {
    __initialStep: "avatar",
  },
};

export const AvatarPrefilled: Story = {
  args: {
    __initialStep: "avatar",
  },
};
