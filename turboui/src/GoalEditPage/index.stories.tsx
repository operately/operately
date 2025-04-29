import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { GoalEditPage } from ".";

const meta: Meta<typeof GoalEditPage> = {
  title: "Pages/GoalEditPage",
  component: GoalEditPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalEditPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    goalName: "Launch AI Platform",
    spaceName: "Marketing",
    spaceLink: "/spaces/ai-research",
    workmapLink: "/spaces/ai-research/workmap",
    goalLink: "/spaces/ai-research/workmap/goals/launch-ai-platform",

    onSave: (_name: string) => fn(),
    onCancel: () => fn(),
  },
};
