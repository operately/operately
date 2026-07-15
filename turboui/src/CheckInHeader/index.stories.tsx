import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { CheckInMetadata, CheckInTitle, type CheckInResourceType } from ".";

const meta = {
  title: "Components/CheckInHeader",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const author = {
  id: "person-1",
  fullName: "Ada Lovelace",
  avatarUrl: null,
};

const formattedTimePreferences = {
  ...defaultFormattedTimePreferences,
  timezone: "America/Sao_Paulo",
  timeFormat: "hour_12" as const,
};

function HeaderPreview({
  resourceType,
  state,
}: {
  resourceType: CheckInResourceType;
  state: "draft" | "scheduled" | "published";
}) {
  const postedAt = "2025-07-13T18:42:00Z";
  const scheduledAt = state === "scheduled" ? "2025-07-14T12:00:00Z" : null;

  return (
    <div className="flex flex-col items-center">
      <CheckInTitle
        state={state}
        timestamp={state === "scheduled" && scheduledAt ? scheduledAt : postedAt}
        formattedTimePreferences={formattedTimePreferences}
      />
      <CheckInMetadata
        resourceType={resourceType}
        author={author}
        acknowledgedBy={resourceType === "goal" ? { fullName: "Grace Hopper" } : null}
        state={state}
        postedAt={postedAt}
        scheduledAt={scheduledAt}
        formattedTimePreferences={formattedTimePreferences}
      />
    </div>
  );
}

export const GoalPublished: Story = {
  render: () => <HeaderPreview resourceType="goal" state="published" />,
};

export const ProjectPublished: Story = {
  render: () => <HeaderPreview resourceType="project" state="published" />,
};

export const Scheduled: Story = {
  render: () => <HeaderPreview resourceType="goal" state="scheduled" />,
};

export const Draft: Story = {
  render: () => <HeaderPreview resourceType="project" state="draft" />,
};
