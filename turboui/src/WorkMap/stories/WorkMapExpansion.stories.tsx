import type { Meta, StoryObj } from "@storybook/react";
import { WorkMapTable } from "../components/WorkMapTable";
import { mockItems } from "../tests/mockData";

const meta = {
  title: "Components/WorkMap/WorkMapTable/ExpansionTest",
  component: WorkMapTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkMapTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithExpansionPersistence: Story = {
  args: {
    items: mockItems,
    tab: "all" as const,
    addingEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: "This story tests the expansion state persistence. Try collapsing some items, then navigate to another story and come back - the expansion states should be preserved via localStorage.",
      },
    },
  },
};