import React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpaceField } from "../SpaceField";
import { GoalAddForm, GoalAddPage } from "./index";

const meta: Meta<typeof GoalAddPage> = {
  title: "Pages/GoalAddPage",
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

    return <GoalAddPage spaceSearch={spaceSearch} save={save} />;
  },
};
