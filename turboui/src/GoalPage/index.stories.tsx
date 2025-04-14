import type { Meta, StoryObj } from "@storybook/react";
import { GoalPage } from "./index";

const meta = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GoalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    goalName: "Improve Customer Experience",
    space: "Product",
    workmap: "Q4 2023 Initiatives",
  },
};
