import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { OptionsMenuItem } from "./index";
import { IconPalette, IconBell, IconTrash } from "../icons";

const meta = {
  title: "Components/OptionsMenuItem",
  component: OptionsMenuItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OptionsMenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: IconPalette,
    title: "Appearance",
    description: "Adjust how Operately looks for you",
    linkTo: "/settings/appearance",
  },
};

export const WithoutDescription: Story = {
  args: {
    icon: IconBell,
    title: "Notification settings",
    linkTo: "/settings/notifications",
  },
};

export const DangerOption: Story = {
  args: {
    icon: IconTrash,
    title: "Delete account",
    description: "Permanently delete your account and all associated data",
    danger: true,
    onClick: () => console.log("Delete clicked"),
  },
};

export const MultipleOptions: Story = {
  args: {
    icon: IconPalette,
    title: "Appearance",
  },
  render: () => (
    <div className="w-96">
      <OptionsMenuItem
        icon={IconPalette}
        title="Appearance"
        description="Adjust how Operately looks for you"
        linkTo="/settings/appearance"
      />
      <OptionsMenuItem
        icon={IconBell}
        title="Notification settings"
        description="Configure how activity and summary emails are delivered"
        linkTo="/settings/notifications"
      />
      <OptionsMenuItem
        icon={IconTrash}
        title="Delete account"
        description="Permanently delete your account and all associated data"
        danger={true}
        onClick={() => console.log("Delete clicked")}
      />
    </div>
  ),
};
