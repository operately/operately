import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DimmedActionLink } from "../Link";
import { OtherPeopleWithAccess, OtherPeopleWithAccessModal } from ".";

const samplePeople: OtherPeopleWithAccess.Person[] = [
  { id: "1", fullName: "Ada Lovelace", avatarUrl: null, accessLevel: 70 },
  { id: "2", fullName: "Grace Hopper", avatarUrl: null, accessLevel: 70 },
  { id: "3", fullName: "Grace Wilson", avatarUrl: null, accessLevel: 70 },
  { id: "4", fullName: "Liam Harris", avatarUrl: null, accessLevel: 70 },
  { id: "5", fullName: "Alan Turing", avatarUrl: null, accessLevel: 40 },
  { id: "6", fullName: "Bob Williams", avatarUrl: null, accessLevel: 40 },
  { id: "7", fullName: "Quinn Walker", avatarUrl: null, accessLevel: 40 },
  { id: "8", fullName: "Katherine Johnson", avatarUrl: null, accessLevel: 10 },
  { id: "9", fullName: "David Brown", avatarUrl: null, accessLevel: 10 },
  { id: "10", fullName: "Olivia Hall", avatarUrl: null, accessLevel: 10 },
];

const meta = {
  title: "Components/OtherPeopleWithAccess",
  component: OtherPeopleWithAccess,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4 bg-surface-base">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OtherPeopleWithAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: {
    people: samplePeople,
  },
};

export const Loading: Story = {
  args: {
    people: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    people: [],
  },
};

export const ModalOpen: Story = {
  args: {
    people: samplePeople,
  },
  render: ({ people, loading }) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <div>
        <DimmedActionLink onClick={() => setIsOpen(true)} underline="hover" className="text-xs">
          Who else has access?
        </DimmedActionLink>
        <OtherPeopleWithAccessModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          people={people}
          loading={loading}
        />
      </div>
    );
  },
};

export const ModalLoading: Story = {
  args: {
    people: [],
    loading: true,
  },
  render: ({ people, loading }) => (
    <OtherPeopleWithAccessModal isOpen={true} onClose={() => undefined} people={people} loading={loading} />
  ),
};
