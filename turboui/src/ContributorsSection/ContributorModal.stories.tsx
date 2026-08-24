import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContributorModal } from "./ContributorModal";

const searchData = {
  people: [
    { id: "1", fullName: "Ada Lovelace", avatarUrl: null, title: "Mathematician" },
    { id: "2", fullName: "Grace Hopper", avatarUrl: null, title: "Computer scientist" },
  ],
  onSearch: async () => undefined,
};

const meta = {
  title: "Components/ContributorModal",
  component: ContributorModal,
  parameters: {
    layout: "centered",
  },
  args: {
    contributor: null,
    searchData,
    onClose: () => undefined,
    onCreate: () => true,
  },
} satisfies Meta<typeof ContributorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {};

export const WithoutFullAccess: Story = {
  args: {
    allowFullAccess: false,
  },
};
