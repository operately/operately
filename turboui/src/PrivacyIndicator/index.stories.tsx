import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import type { AccessLevels } from "../ApiTypes";
import { PrivacyIndicator, SpacePrivacyIndicator } from ".";

const meta = {
  title: "Components/PrivacyIndicator",
  component: SpacePrivacyIndicator,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SpacePrivacyIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

function accessLevels(overrides: Partial<AccessLevels> = {}): AccessLevels {
  return {
    __typename: "access_levels",
    public: 0,
    company: 0,
    space: 70,
    ...overrides,
  };
}

export const PublicSpace: Story = {
  args: {
    accessLevels: accessLevels({ public: 10 }),
    iconSize: 24,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <SpacePrivacyIndicator {...args} />
      <span className="font-semibold">Public Space</span>
    </div>
  ),
};

export const CompanyVisibleSpace: Story = {
  args: {
    accessLevels: accessLevels({ company: 10 }),
    iconSize: 24,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <SpacePrivacyIndicator {...args} />
      <span className="font-semibold">Company-Visible Space</span>
      <span className="text-content-dimmed text-sm">(no indicator)</span>
    </div>
  ),
};

export const InviteOnlySpace: Story = {
  args: {
    accessLevels: accessLevels({ public: 0, company: 0 }),
    iconSize: 24,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <SpacePrivacyIndicator {...args} />
      <span className="font-semibold">Invite-Only Space</span>
    </div>
  ),
};

export const MissingAccessLevels: Story = {
  args: {
    accessLevels: null,
    iconSize: 24,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <SpacePrivacyIndicator {...args} />
      <span className="font-semibold">Missing Access Levels</span>
      <span className="text-content-dimmed text-sm">(no indicator)</span>
    </div>
  ),
};

export const GoalAndProjectIndicators: Story = {
  args: {
    accessLevels: null,
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PrivacyIndicator privacyLevel="public" resourceType="goal" spaceName="Product" iconSize={16} />
        <span>Public goal</span>
      </div>
      <div className="flex items-center gap-2">
        <PrivacyIndicator privacyLevel="confidential" resourceType="project" spaceName="Product" iconSize={16} />
        <span>Confidential project</span>
      </div>
      <div className="flex items-center gap-2">
        <PrivacyIndicator privacyLevel="secret" resourceType="goal" spaceName="Product" iconSize={16} />
        <span>Secret goal (error-colored lock)</span>
      </div>
      <div className="flex items-center gap-2">
        <PrivacyIndicator privacyLevel="secret" resourceType="space" spaceName="" iconSize={16} />
        <span>Secret space (default lock color)</span>
      </div>
    </div>
  ),
};
