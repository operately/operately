import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { SpaceCard } from "./SpaceCard";
import { SpaceCardGrid } from "./SpaceCardGrid";
import {
  companySpaceCardProps,
  defaultSpaceCardProps,
  inviteOnlySpaceCardProps,
  publicSpaceCardProps,
} from "./mockData";

const meta = {
  title: "Components/SpaceCards",
  component: SpaceCard,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <SpaceCardGrid>
        <Story />
      </SpaceCardGrid>
    ),
  ],
} satisfies Meta<typeof SpaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultSpaceCardProps,
};

export const Public: Story = {
  args: publicSpaceCardProps,
};

export const CompanyVisible: Story = {
  args: companySpaceCardProps,
};

export const InviteOnly: Story = {
  args: inviteOnlySpaceCardProps,
};

export const MissingMission: Story = {
  args: {
    ...defaultSpaceCardProps,
    mission: null,
  },
};

export const EmptyMembers: Story = {
  args: {
    ...defaultSpaceCardProps,
    members: [],
  },
};

export const LargeShadow: Story = {
  args: {
    ...defaultSpaceCardProps,
    shadowSize: "lg",
  },
};

export const ClickWithoutLink: Story = {
  args: {
    ...defaultSpaceCardProps,
    linkTo: undefined,
    onClick: () => console.log("Space card clicked"),
  },
};

export const Grid: Story = {
  render: () => (
    <>
      <SpaceCard {...companySpaceCardProps} />
      <SpaceCard {...defaultSpaceCardProps} />
      <SpaceCard {...publicSpaceCardProps} />
      <SpaceCard {...inviteOnlySpaceCardProps} />
      <SpaceCard {...defaultSpaceCardProps} name="Engineering" mission={null} members={[]} linkTo="/spaces/eng" />
      <SpaceCard
        {...defaultSpaceCardProps}
        name="Marketing"
        mission="Grow awareness and demand."
        linkTo="/spaces/marketing"
      />
    </>
  ),
};
