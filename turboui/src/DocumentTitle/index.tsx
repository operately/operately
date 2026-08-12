import * as React from "react";

import { Avatar, type AvatarPerson } from "../Avatar";
import { BulletDot } from "../BulletDot";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { ScheduledPostDate, ScheduledPostLabel } from "../SchedulePosting";

const validStates = ["draft", "scheduled", "published"] as const;

export namespace DocumentTitle {
  export type State = (typeof validStates)[number];

  export interface Props {
    title: string;
    state: string;
    author: AvatarPerson | null;
    publishedAt?: string;
    scheduledAt?: string | null;
    modifiedAt?: string | null;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

export function DocumentTitle({
  title,
  author,
  state,
  publishedAt,
  scheduledAt,
  modifiedAt,
  formattedTimePreferences,
}: DocumentTitle.Props) {
  verifyState(state);
  verifyPublishedAt(state, publishedAt);
  const showModifiedAt = shouldShowModifiedAt(publishedAt, modifiedAt);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2 text-content-accent text-xl sm:text-2xl md:text-3xl font-extrabold text-center">
        <span>{title}</span>
        {state === "scheduled" && <ScheduledPostLabel />}
      </div>
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        {author && (
          <div className="flex items-center gap-1">
            <Avatar person={author} size="tiny" /> {author.fullName}
          </div>
        )}

        {state === "published" && (
          <>
            {author && <BulletDot margin="mx-0.5" />}
            <span>Posted</span>
            <FormattedTime {...formattedTimePreferences} time={publishedAt!} format="relative-time-or-date" />
          </>
        )}

        {state === "scheduled" && scheduledAt && (
          <>
            {author && <BulletDot margin="mx-0.5" />}
            <ScheduledPostDate scheduledAt={scheduledAt} formattedTimePreferences={formattedTimePreferences} />
          </>
        )}

        {state === "published" && showModifiedAt && (
          <>
            <BulletDot margin="mx-0.5" />
            <span>Edited</span>
            <FormattedTime {...formattedTimePreferences} time={modifiedAt!} format="relative-time-or-date" />
          </>
        )}
      </div>
    </div>
  );
}

function verifyState(state: string) {
  if (!validStates.includes(state as DocumentTitle.State)) {
    throw new Error(`Invalid state: ${state}`);
  }
}

function verifyPublishedAt(state: string, publishedAt?: string) {
  if (state === "published" && !publishedAt) {
    throw new Error("Published documents must have a publishedAt date");
  }
}

function shouldShowModifiedAt(publishedAt?: string, modifiedAt?: string | null) {
  if (!modifiedAt) return false;
  if (!publishedAt) return true;

  const publishedTime = new Date(publishedAt).getTime();
  const modifiedTime = new Date(modifiedAt).getTime();

  if (Number.isNaN(publishedTime) || Number.isNaN(modifiedTime)) {
    return publishedAt !== modifiedAt;
  }

  return publishedTime !== modifiedTime;
}
