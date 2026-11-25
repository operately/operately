import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { useTranslation } from "react-i18next";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { IconEdit, IconTrash } from "../icons";
import { PageOptions } from "../Page/PageOptions";
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
  showPendingAcknowledgement,
  date,
}: {
  resourceType: CheckInResourceType;
  state: "draft" | "scheduled" | "published";
  showPendingAcknowledgement?: boolean;
  date?: string;
}) {
  const postedAt = date ?? "2025-07-13T18:42:00Z";
  const scheduledAt = state === "scheduled" ? (date ?? "2025-07-14T12:00:00Z") : null;

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
        showPendingAcknowledgement={showPendingAcknowledgement}
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

export const ProjectPublishedWithoutReviewer: Story = {
  render: () => <HeaderPreview resourceType="project" state="published" showPendingAcknowledgement={false} />,
};

export const Scheduled: Story = {
  render: () => <HeaderPreview resourceType="goal" state="scheduled" />,
};

export const Draft: Story = {
  render: () => <HeaderPreview resourceType="project" state="draft" />,
};

function PaperPreview({ state }: { state: "published" | "draft" | "scheduled" }) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full bg-surface-base" data-test-id="check-in-paper-preview">
      <PageOptions
        options={[
          {
            type: "action",
            icon: IconEdit,
            label: t("Edit"),
            onClick: () => {},
            keepOutsideOnBigScreen: true,
            testId: "check-in-edit",
          },
          {
            type: "action",
            icon: IconTrash,
            label: state === "published" ? t("Delete check-in") : t("Discard draft"),
            onClick: () => {},
          },
        ]}
        testId="check-in-options"
      />
      <div className="p-4 md:p-8 lg:px-28 lg:pt-8">
        <HeaderPreview resourceType="project" state={state} date="2026-09-30T12:00:00Z" />
      </div>
    </div>
  );
}

export const PaperPublished: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <PaperPreview state="published" />,
};

export const PaperDraft: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <PaperPreview state="draft" />,
};

export const PaperScheduled: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <PaperPreview state="scheduled" />,
};
