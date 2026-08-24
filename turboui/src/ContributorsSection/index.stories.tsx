import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContributorsSection, type Contributor } from ".";

const activeContributors: Contributor[] = [
  {
    id: "1",
    person: {
      id: "person-1",
      fullName: "Ada Lovelace",
      avatarUrl: null,
      title: "Mathematician",
    },
  },
  {
    id: "2",
    person: {
      id: "person-2",
      fullName: "Grace Hopper",
      avatarUrl: null,
      title: "Computer scientist",
    },
  },
];

const unavailableContributor: Contributor = {
  id: "3",
  active: false,
  person: null,
};

const meta = {
  title: "Components/ContributorsSection",
  component: ContributorsSection,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-72 p-4 bg-surface-base border border-surface-outline rounded-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContributorsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    contributors: [],
  },
};

export const Populated: Story = {
  args: {
    contributors: activeContributors,
  },
};

export const Editable: Story = {
  args: {
    contributors: activeContributors,
    canEdit: true,
    onAdd: () => console.log("add contributor"),
    onEdit: (contributor) => console.log("edit contributor", contributor.id),
    onDelete: (id) => console.log("delete contributor", id),
    addButtonTestId: "add-template-contributor",
    testIdPrefix: "template-person",
  },
};

export const WithUnavailable: Story = {
  args: {
    contributors: [...activeContributors, unavailableContributor],
    canEdit: true,
    onAdd: () => console.log("add contributor"),
    onEdit: (contributor) => console.log("edit contributor", contributor.id),
    onDelete: (id) => console.log("delete contributor", id),
    addButtonTestId: "add-template-contributor",
    testIdPrefix: "template-person",
  },
};
