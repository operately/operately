import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { genPerson } from "../utils/storybook/genPeople";
import { GoalAddModal } from "./index";

const meta: Meta<typeof GoalAddModal> = {
  title: "turboui/GoalAddModal",
  component: GoalAddModal,
};
export default meta;

type Story = StoryObj<typeof GoalAddModal>;

const parentGoal = {
  id: "parent-goal-id",
  name: "Improve team collaboration",
  link: "#",
};

const space = {
  id: "space-id",
  name: "Customer Success",
  link: "#",
};

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <GoalAddModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onAdd={(data) => {
          // eslint-disable-next-line no-console
          console.log("Goal added:", data);
          setOpen(false);
        }}
        initialChampion={genPerson()}
        initialReviewer={genPerson()}
        initialParentGoal={parentGoal}
        initialDueDate={new Date()}
        initialSpace={space}
        searchGoals={({}: { query: string }) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve([
                { id: "goal-1", name: "Goal 1", link: "#" },
                { id: "goal-2", name: "Goal 2", link: "#" },
              ]);
            }, 500);
          });
        }}
        searchSpaces={({}: { query: string }) => {
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
