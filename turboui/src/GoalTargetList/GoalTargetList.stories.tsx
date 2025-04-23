import type { Meta, StoryObj } from "@storybook/react";
import { GoalTargetList } from "./index";
import { Page } from "../Page";

const meta = {
  title: "Components/GoalTargetList",
  component: GoalTargetList,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="mt-12">
        <Page title="Goal Target List" size="medium">
          <div className="p-36">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
} satisfies Meta<typeof GoalTargetList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTargets = [
  {
    id: "1",
    index: 0,
    name: "Double the Revenue",
    from: 1000000,
    to: 2000000,
    value: 1500000,
    unit: "USD",
    mode: "view" as const,
  },
  {
    id: "2",
    index: 1,
    name: "Increase Customer Satisfaction",
    from: 85,
    to: 95,
    value: 90,
    unit: "%",
    mode: "view" as const,
  },
  {
    id: "3",
    index: 2,
    name: "Improve employee Retention",
    from: 75,
    to: 60,
    value: 65,
    unit: "%",
    mode: "view" as const,
  },
];

export const Default: Story = {
  args: {
    targets: mockTargets,
    showEditButton: true,
    showAddNewDialog: false,
  },
};

export const EditMode: Story = {
  args: {
    targets: mockTargets.map((t, i) => ({ ...t, mode: i === 1 ? "edit" : "view" })),
    showEditButton: true,
    showAddNewDialog: false,
  },
};

export const DeleteMode: Story = {
  args: {
    targets: mockTargets.map((t, i) => ({ ...t, mode: i === 1 ? "delete" : "view" })),
    showEditButton: true,
    showAddNewDialog: false,
  },
};

export const ReadOnly: Story = {
  args: {
    targets: mockTargets.map((t) => ({ ...t, showEditValueButton: false })),
    showAddNewDialog: false,
  },
};

export const AddMode: Story = {
  args: {
    targets: mockTargets,
    showAddNewDialog: true,
  },
};
