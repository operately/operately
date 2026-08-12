import React from "react";
import { Avatar } from "../Avatar";
import { FormattedTime } from "../FormattedTime";
import type { FormattedTimePreferences } from "../FormattedTime";
import { IconSquareCheckFilled, IconSquareChevronsLeftFilled } from "../icons";
import type { MilestoneActivity } from "../Timeline/types";
import type { Person } from "./types";

interface MilestoneFeedRowProps {
  activity: MilestoneActivity;
  formattedTimePreferences: FormattedTimePreferences;
  label: string;
  icon: React.ReactNode;
}

function MilestoneFeedRow({ activity, formattedTimePreferences, label, icon }: MilestoneFeedRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="shrink-0 mt-1">
        <Avatar person={activity.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {icon}
            <div className="flex-1 pr-2 font-semibold text-content-accent">{label}</div>
          </div>

          <span className="text-content-dimmed text-sm">
            <FormattedTime {...formattedTimePreferences} time={activity.insertedAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function MilestoneCompletedFeedRow({
  activity,
  formattedTimePreferences,
}: {
  activity: MilestoneActivity;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <MilestoneFeedRow
      activity={activity}
      formattedTimePreferences={formattedTimePreferences}
      label="Completed the Milestone"
      icon={<IconSquareCheckFilled size={20} className="text-accent-1" />}
    />
  );
}

export function MilestoneReopenedFeedRow({
  activity,
  formattedTimePreferences,
}: {
  activity: MilestoneActivity;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <MilestoneFeedRow
      activity={activity}
      formattedTimePreferences={formattedTimePreferences}
      label="Re-Opened the Milestone"
      icon={<IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />}
    />
  );
}

export function AcknowledgmentFeedRow({
  person,
  ackAt,
  label = "Check-In",
  formattedTimePreferences,
}: {
  person: Person;
  ackAt: string;
  label?: string;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-6 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={person} size="normal" />
      </div>

      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-2 font-bold flex-1">
          {person.fullName} acknowledged this {label}
          <IconSquareCheckFilled size={24} className="text-accent-1" />
        </div>

        <span className="text-content-dimmed text-sm">
          <FormattedTime {...formattedTimePreferences} time={ackAt} format="relative" />
        </span>
      </div>
    </div>
  );
}
