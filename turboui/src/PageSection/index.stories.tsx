import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { SecondaryButton } from "../Button";
import { PageSection } from "./index";

const meta = {
  title: "Components/PageSection",
  component: PageSection,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof PageSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: "Administrators",
    children: <p className="text-sm text-content-dimmed">People with admin access to the company.</p>,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Account Owners",
    subtitle: "Owners have the highest level of access and can manage all aspects of the company.",
    children: <p className="text-sm text-content-dimmed">Owner list goes here.</p>,
  },
};

export const WithActions: Story = {
  args: {
    title: "Current Team Members",
    subtitle: "Add new team members, update profiles, or remove access as needed.",
    actions: <SecondaryButton size="sm">Invite people</SecondaryButton>,
    children: <p className="text-sm text-content-dimmed">Member list goes here.</p>,
  },
};
