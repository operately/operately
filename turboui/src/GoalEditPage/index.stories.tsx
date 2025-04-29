import type { Meta, StoryObj } from "@storybook/react";
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
    initialName: "Launch AI Platform",
    onSave: (name: string) => alert(`Saved: ${name}`),
    onCancel: () => alert("Cancelled"),
  },
};

export const EmptyInitial: Story = {
  args: {
    initialName: "",
    onSave: (name: string) => alert(`Saved: ${name}`),
    onCancel: () => alert("Cancelled"),
  },
};
