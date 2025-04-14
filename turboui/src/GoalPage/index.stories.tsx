import type { Meta, StoryObj } from "@storybook/react";
import { GoalPage } from "./index";

const meta = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",

    goalName: "Launch AI Platform",
    spaceName: "Product",
  },
};
