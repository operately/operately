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
    name: "Double the Revenue",
    from: 1000000,
    to: 2000000,
    value: 1500000,
    unit: "USD",
  },
  {
    id: "2",
    name: "Increase Customer Satisfaction",
    from: 85,
    to: 95,
    value: 90,
    unit: "%",
  },
  {
    id: "3",
    name: "Improce employee Retention",
    from: 75,
    to: 60,
    value: 65,
    unit: "%",
  },
];

export const Default: Story = {
  args: {
    targets: mockTargets,
  },
};
