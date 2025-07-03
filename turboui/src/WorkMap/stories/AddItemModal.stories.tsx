import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AddItemModal } from "../components/AddItemModal";

const meta: Meta<typeof AddItemModal> = {
  title: "Components/WorkMap/AddItemModal",
  component: AddItemModal,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full overflow-x-auto">
        <Story />
      </div>
    ),
  ],
  argTypes: {},
  args: {
    isOpen: true,
    close: () => {},
    parentGoal: { name: "Parent Goal" },
    spaceSearch: async ({}: { query: string }) => {
      return [{ id: "space1", name: "Space 1", link: "/spaces/space1" }];
    },
    save: async (_props: any) => {
      return { id: "new-item-id" };
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default AddItemModal showing the modal open
 */
export const Default: Story = {};

function Component() {
  const [isOpen, setIsOpen] = React.useState(true);
  const close = () => setIsOpen(false);
  const parentGoal = { name: "Parent Goal" };
  const spaceSearch = async ({}: { query: string }) => {
    // Mock search function
    return [{ id: "space1", name: "Space 1", link: "/spaces/space1" }];
  };

  const save = async (_props: any) => {
    // Mock save function
    return { id: "new-item-id" };
  };

  return <AddItemModal isOpen={isOpen} close={close} parentGoal={parentGoal} spaceSearch={spaceSearch} save={save} />;
}

export const Interactive: Story = {
  render: () => <Component />,
};
