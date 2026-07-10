import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconPencil,
  IconRotateDot,
  IconSettings,
  IconTrash,
} from "../icons";
import React from "react";
import { ActionList } from ".";

const meta: Meta<typeof ActionList> = {
  title: "Components/ActionList",
  component: ActionList,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-surface-base border border-surface-outline rounded-md w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActionList>;

/**
 * Basic example of an ActionList with different types of actions.
 */
export const Default: Story = {
  args: {
    actions: [
      {
        type: "link",
        label: "View Details",
        link: "#",
        icon: IconCircleCheck,
      },
      {
        type: "action",
        label: "Refresh Data",
        onClick: () => console.log("Refresh clicked"),
        icon: IconRotateDot,
      },
      {
        type: "link",
        label: "Navigate to Dashboard",
        link: "#",
        icon: IconCircleArrowRight,
      },
    ],
  },
};

/**
 * Example showing an ActionList with a dangerous action.
 */
export const WithDangerAction: Story = {
  args: {
    actions: [
      {
        type: "link",
        label: "Edit Settings",
        link: "#",
        icon: IconSettings,
      },
      {
        type: "action",
        label: "Edit Content",
        onClick: () => console.log("Edit clicked"),
        icon: IconPencil,
      },
      {
        type: "action",
        label: "Delete",
        onClick: () => console.log("Delete clicked"),
        icon: IconTrash,
        danger: true,
      },
    ],
  },
};

/**
 * Example showing an ActionList with some hidden items.
 * Hidden items are not rendered at all.
 */
export const WithHiddenItems: Story = {
  args: {
    actions: [
      {
        type: "link",
        label: "Visible Link",
        link: "#",
        icon: IconCircleCheck,
      },
      {
        type: "action",
        label: "Hidden Action",
        onClick: () => console.log("This should not appear"),
        icon: IconRotateDot,
        hidden: true,
      },
      {
        type: "action",
        label: "Visible Action",
        onClick: () => console.log("Visible action clicked"),
        icon: IconSettings,
      },
      {
        type: "link",
        label: "Hidden Link",
        link: "#",
        icon: IconCircleArrowRight,
        hidden: true,
      },
    ],
  },
};
