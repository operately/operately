import type { Meta, StoryObj } from "@storybook/react-vite";
import { TitleSetupPrompt } from ".";
import { withMockWorkspaceBackdrop } from "../OnboardingWizard/storyUtils";

const meta = {
  title: "Components/Onboarding/TitleSetupPrompt",
  component: TitleSetupPrompt,
  parameters: { layout: "fullscreen" },
  args: { onSave: async () => {}, onSkip: async () => {} },
  decorators: [withMockWorkspaceBackdrop],
} satisfies Meta<typeof TitleSetupPrompt>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
