import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { GoalAddModal } from "./index";

const meta: Meta<typeof GoalAddModal> = {
  title: "turboui/GoalAddModal",
  component: GoalAddModal,
};
export default meta;

type Story = StoryObj<typeof GoalAddModal>;

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
      />
    );
  },
};
