import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccessLevelSummary } from ".";

const VIEW_ACCESS = 10;
const COMMENT_ACCESS = 40;
const EDIT_ACCESS = 70;
const FULL_ACCESS = 100;
const NO_ACCESS = 0;

const meta = {
  title: "Components/AccessLevelSummary",
  component: AccessLevelSummary,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AccessLevelSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicPresent: Story = {
  args: {
    resourceType: "project",
    tense: "present",
    anonymous: VIEW_ACCESS,
    company: NO_ACCESS,
    space: NO_ACCESS,
  },
};

export const PublicFuture: Story = {
  args: {
    resourceType: "goal",
    tense: "future",
    anonymous: VIEW_ACCESS,
    company: COMMENT_ACCESS,
    space: NO_ACCESS,
  },
};

export const CompanyWidePresent: Story = {
  args: {
    resourceType: "space",
    tense: "present",
    anonymous: NO_ACCESS,
    company: EDIT_ACCESS,
  },
};

export const CompanyWideFuture: Story = {
  args: {
    resourceType: "project",
    tense: "future",
    anonymous: NO_ACCESS,
    company: FULL_ACCESS,
    space: FULL_ACCESS,
  },
};

export const SpaceWidePresent: Story = {
  args: {
    resourceType: "project",
    tense: "present",
    anonymous: NO_ACCESS,
    company: NO_ACCESS,
    space: COMMENT_ACCESS,
  },
};

export const SpaceWideFuture: Story = {
  args: {
    resourceType: "goal",
    tense: "future",
    anonymous: NO_ACCESS,
    company: NO_ACCESS,
    space: VIEW_ACCESS,
  },
};

export const InviteOnlyPresent: Story = {
  args: {
    resourceType: "space",
    tense: "present",
    anonymous: NO_ACCESS,
    company: NO_ACCESS,
  },
};

export const InviteOnlyFuture: Story = {
  args: {
    resourceType: "project",
    tense: "future",
    anonymous: NO_ACCESS,
    company: NO_ACCESS,
    space: NO_ACCESS,
  },
};

export const WithoutIcon: Story = {
  args: {
    resourceType: "space",
    tense: "future",
    anonymous: VIEW_ACCESS,
    company: NO_ACCESS,
    hideIcon: true,
  },
};

export const AllVisibilityStates: Story = {
  args: {
    resourceType: "project",
    tense: "present",
    anonymous: VIEW_ACCESS,
    company: NO_ACCESS,
    space: NO_ACCESS,
  },
  render: () => (
    <div className="flex flex-col gap-6 w-[420px]">
      <AccessLevelSummary
        resourceType="project"
        tense="present"
        anonymous={VIEW_ACCESS}
        company={NO_ACCESS}
        space={NO_ACCESS}
      />
      <AccessLevelSummary
        resourceType="goal"
        tense="present"
        anonymous={NO_ACCESS}
        company={EDIT_ACCESS}
        space={EDIT_ACCESS}
      />
      <AccessLevelSummary
        resourceType="project"
        tense="present"
        anonymous={NO_ACCESS}
        company={NO_ACCESS}
        space={COMMENT_ACCESS}
      />
      <AccessLevelSummary resourceType="space" tense="present" anonymous={NO_ACCESS} company={NO_ACCESS} />
      <AccessLevelSummary
        resourceType="project"
        tense="future"
        anonymous={NO_ACCESS}
        company={VIEW_ACCESS}
        space={FULL_ACCESS}
        hideIcon
      />
    </div>
  ),
};
