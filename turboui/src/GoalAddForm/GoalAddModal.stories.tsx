import React from "react";

import type { Meta, StoryObj } from "@storybook/react";
import { SecondaryButton } from "../Button";
import { SpaceField } from "../SpaceField";
import { GoalAddForm, GoalAddModal, GoalAddPage } from "./index";

const meta: Meta<typeof GoalAddPage> = {
  title: "Components/GoalAddModal",
  component: GoalAddPage,
};

export default meta;

type Story = StoryObj<typeof GoalAddPage>;

export const Default: Story = {
  render: () => {
    const spaceSearch = async ({}: { query: string }): Promise<SpaceField.Space[]> => {
      return new Promise<SpaceField.Space[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: "space-1", name: "Space 1", link: "#" },
            { id: "space-2", name: "Space 2", link: "#" },
          ]);
        }, 500);
      });
    };

    const save = async (props: GoalAddForm.SaveProps): Promise<{ id: string }> => {
      console.log("Goal saved:", props);

      return new Promise<{ id: string }>((resolve) => {
        setTimeout(() => {
          resolve({ id: "goal-123" });
        }, 1000);
      });
    };

    const [isOpen, setIsOpen] = React.useState(false);
    const close = () => setIsOpen(false);
    const open = () => setIsOpen(true);

    return (
      <div>
        <GoalAddModal spaceSearch={spaceSearch} save={save} isOpen={isOpen} close={close} />
        <SecondaryButton onClick={open}>Show Modal</SecondaryButton>
      </div>
    );
  },
};
