import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconTarget } from "../icons";
import React from "react";
import { Page } from "../Page";
import { GoalField } from "./index";

/**
 * GoalField is a component for displaying and selecting a goal within a popover interface.
 * Key features:
 * - Displays goal icon, name, and description when assigned
 * - Shows placeholder state with target icon when no goal is assigned
 * - Supports different icon sizes
 * - Can show or hide goal description
 * - Supports readonly mode to disable interactions
 * - Uses Radix UI Popover for potential future selection functionality
 */
const meta: Meta<typeof GoalField> = {
  title: "Components/Fields/GoalField",
  component: GoalField,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    goal: { control: "object" },
    iconSize: { control: "number" },
    readonly: { control: "boolean" },
  },
} satisfies Meta<typeof GoalField>;

export default meta;
type Story = StoryObj<typeof meta>;

const goal = { id: "1", name: "Improve team collaboration", link: "#" };
const potentialGoals = [
  { id: "1", name: "Improve team collaboration", link: "#" },
  { id: "2", name: "Increase customer satisfaction", link: "#" },
  { id: "3", name: "Boost sales performance", link: "#" },
  { id: "4", name: "Enhance product quality", link: "#" },
  { id: "5", name: "Expand market reach", link: "#" },
];

const searchGoals = async ({ query }) => {
  if (!query) {
    return potentialGoals;
  }
  return potentialGoals.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));
};

const Component = (args: Partial<GoalField.Props>) => {
  const [goal, setGoal] = React.useState<GoalField.Goal | null>(args.goal || null);

  return <GoalField {...args} goal={goal} setGoal={setGoal} searchGoals={searchGoals} />;
};

export const AllStates: Story = {
  render: () => {
    return (
      <Page title="GoalField All States" size="medium">
        <div className="grid grid-cols-2 gap-8 p-12">
          <div>
            <div className="font-bold text-content-dimmed mb-6 pb-2">Editable</div>
            <div className="space-y-8">
              <div>
                <Label>Default</Label>
                <Component goal={goal} searchGoals={searchGoals} />
              </div>

              <div>
                <Label>Empty State</Label>
                <Component goal={null} searchGoals={searchGoals} />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <Component goal={null} emptyStateMessage="Set goal" searchGoals={searchGoals} />
              </div>

              <div>
                <Label>Dialog Open</Label>
                <Component
                  goal={goal}
                  emptyStateMessage="Set goal"
                  searchGoals={searchGoals}
                  isOpen
                  extraDialogMenuOptions={[
                    {
                      label: "Mark as priority",
                      onClick: () => alert("Custom option clicked"),
                      icon: IconTarget,
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold text-content-dimmed mb-6 pb-2">Read Only</div>

            <div className="space-y-8">
              <div>
                <Label>Default</Label>
                <Component goal={goal} readonly searchGoals={searchGoals} />
              </div>

              <div>
                <Label>Empty State</Label>
                <Component goal={null} readonly emptyStateMessage="Select goal" searchGoals={searchGoals} />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <Component goal={null} readonly emptyStateReadOnlyMessage="No goal" searchGoals={searchGoals} />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};

const Label = ({ children }) => <div className="font-bold text-xs text-content-dimmed mb-3">{children}</div>;
