import React from "react";

import { Avatar } from "../Avatar";
import type { CheckInState, Person } from "../ApiTypes";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconSquareCheckFilled } from "../icons";
import { ScheduledPostDate, ScheduledPostLabel } from "../SchedulePosting";
import { StatusBadge } from "../StatusBadge";
import { TextSeparator } from "../TextSeparator";
import { PostedTime } from "./PostedTime";
import { parseCheckInTimestamp, type CheckInTimestamp } from "./timestamp";

export { PostedTime } from "./PostedTime";
export type { PostedTimeProps } from "./PostedTime";

export type CheckInResourceType = "goal" | "project";

export interface CheckInTitleProps {
  state: CheckInState;
  timestamp: CheckInTimestamp;
  formattedTimePreferences: FormattedTimePreferences;
}

export function CheckInTitle({ state, timestamp, formattedTimePreferences }: CheckInTitleProps) {
  const postingTime = parseCheckInTimestamp(timestamp);

  return (
    <h1 className="flex flex-wrap items-center justify-center gap-2 text-content-accent text-xl sm:text-3xl font-extrabold text-center">
      <span>
        Check-In for <FormattedTime {...formattedTimePreferences} time={postingTime} format="long-date" />
      </span>
      {state === "draft" && <StatusBadge status="pending" customLabel="Draft" hideIcon />}
      {state === "scheduled" && <ScheduledPostLabel />}
    </h1>
  );
}

type CheckInAuthor = Pick<Person, "id" | "fullName" | "avatarUrl">;
type CheckInAcknowledgingPerson = Pick<Person, "fullName">;

export interface CheckInMetadataProps {
  resourceType: CheckInResourceType;
  author?: CheckInAuthor | null;
  acknowledgedBy?: CheckInAcknowledgingPerson | null;
  state: CheckInState;
  postedAt: string | Date;
  scheduledAt?: string | Date | null;
  formattedTimePreferences: FormattedTimePreferences;
}

export function CheckInMetadata({
  resourceType,
  author,
  acknowledgedBy,
  state,
  postedAt,
  scheduledAt,
  formattedTimePreferences,
}: CheckInMetadataProps) {
  const containerClass =
    resourceType === "goal"
      ? "flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 mt-1 font-medium text-sm sm:text-base"
      : "flex flex-row flex-wrap items-center justify-center gap-x-0.5 gap-y-1 mt-1 text-content-accent font-medium";
  const authorGapClass = resourceType === "goal" ? "gap-1" : "gap-2";
  const scheduledPostingTime = scheduledAt ? parseCheckInTimestamp(scheduledAt) : null;

  return (
    <div className={containerClass}>
      {author && (
        <div className={`flex items-center ${authorGapClass}`}>
          <Avatar person={author} size="tiny" /> {author.fullName}
        </div>
      )}
      {state === "scheduled" && scheduledPostingTime && (
        <MetadataItem showSeparator={Boolean(author)}>
          <ScheduledPostDate scheduledAt={scheduledPostingTime} formattedTimePreferences={formattedTimePreferences} />
        </MetadataItem>
      )}
      {state === "published" && (
        <>
          <MetadataItem showSeparator={Boolean(author)}>
            <PostedTime time={postedAt} formattedTimePreferences={formattedTimePreferences} />
          </MetadataItem>
          <MetadataItem>
            <Acknowledgement acknowledgedBy={acknowledgedBy} />
          </MetadataItem>
        </>
      )}
    </div>
  );
}

function Acknowledgement({ acknowledgedBy }: { acknowledgedBy?: CheckInAcknowledgingPerson | null }) {
  if (!acknowledgedBy) {
    return <span className="flex items-center gap-1">Not yet acknowledged</span>;
  }

  return (
    <span className="flex items-center gap-1">
      <IconSquareCheckFilled size={16} className="text-accent-1" />
      <span className="hidden sm:inline">Acknowledged by</span>
      <span className="truncate">{acknowledgedBy.fullName}</span>
    </span>
  );
}

function MetadataItem({ children, showSeparator = true }: { children: React.ReactNode; showSeparator?: boolean }) {
  return (
    <div className="flex items-center">
      {showSeparator && <TextSeparator />}
      {children}
    </div>
  );
}
