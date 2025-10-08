import type { Meta, StoryObj } from "@storybook/react";

import { CompanyCreatorOnboardingWizard } from "./CompanyCreatorOnboarding";
import { withMockWorkspaceBackdrop } from "./storyUtils";

const meta = {
  title: "Components/Onboarding/CompanyCreatorOnboardingWizard",
  component: CompanyCreatorOnboardingWizard,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    invitationLink: "https://operately.com/invite/sample-onboarding",
    markoImageUrl: "https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg",
    onComplete: () => {},
    onDismiss: () => {},
  },
  decorators: [withMockWorkspaceBackdrop],
} satisfies Meta<typeof CompanyCreatorOnboardingWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  args: {
    __initialStep: "welcome",
  },
};

export const Spaces: Story = {
  args: {
    __initialStep: "spaces",
  },
};

export const Invite: Story = {
  args: {
    __initialStep: "invite",
  },
};
