import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "../Page";
import { GoalTargetList } from "./index";

const meta = {
  title: "Components/GoalTargetList",
  component: GoalTargetList,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (_, context) => {
      const [addActive, setAddActive] = React.useState(context.args.addActive);

      return (
        <div className="mt-12">
          <Page title="Goal Target List" size="medium">
            <div className="p-36">
              <GoalTargetList {...context.args} addActive={addActive} onAddActiveChange={setAddActive} />
            </div>
          </Page>
        </div>
      );
    },
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

const randId = () => crypto.randomUUID() as string;

const defaultArgs = {
  addTarget: (): Promise<{ success: boolean; id: string }> =>
    new Promise((resolve) => resolve({ success: true, id: randId() })),

  deleteTarget: (): Promise<boolean> => new Promise((resolve) => resolve(true)),
  updateTarget: (): Promise<boolean> => new Promise((resolve) => resolve(true)),
  updateTargetValue: (): Promise<boolean> => new Promise((resolve) => resolve(true)),
  updateTargetIndex: (): Promise<boolean> => new Promise((resolve) => resolve(true)),
};

export const Default: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets,
    showEditButton: true,
    showUpdateButton: true,
    addActive: false,
  },
};

export const UpdateMode: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets.map((t, i) => ({ ...t, mode: i === 1 ? "update" : "view" })),
    showEditButton: true,
    showUpdateButton: true,
  },
};

export const EditMode: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets.map((t, i) => ({ ...t, mode: i === 1 ? "edit" : "view" })),
    showEditButton: true,
    showUpdateButton: true,
  },
};

export const DeleteMode: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets.map((t, i) => ({ ...t, mode: i === 1 ? "delete" : "view" })),
    showEditButton: true,
    showUpdateButton: true,
  },
};

export const ReadOnly: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets.map((t) => ({ ...t, showEditValueButton: false })),
  },
};

export const AddMode: Story = {
  args: {
    ...defaultArgs,
    targets: mockTargets,
    addActive: true,
    showUpdateButton: true,
  },
};
