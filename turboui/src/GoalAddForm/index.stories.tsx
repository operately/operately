import React from "react";

import type { Meta, StoryObj } from "@storybook/react";
import { GoalAddPage } from "./index";

const meta: Meta<typeof GoalAddPage> = {
  title: "Pages/GoalAddPage",
  component: GoalAddPage,
};

export default meta;

type Story = StoryObj<typeof GoalAddPage>;

export const Default: Story = {
  render: () => {
    return (
      <GoalAddPage
        spaceSearch={({}: { query: string }) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve([
                { id: "space-1", name: "Space 1", link: "#" },
                { id: "space-2", name: "Space 2", link: "#" },
              ]);
            }, 500);
          });
        }}
      />
    );
  },
};
