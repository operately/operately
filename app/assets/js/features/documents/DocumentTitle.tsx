import * as React from "react";
import * as People from "@/models/people";
import { Avatar } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import { BulletDot } from "@/components/TextElements";

const validStates = ["draft", "published"];

interface TitleProps {
  title: string;
  state: string;
  author: People.Person | null;
  publishedAt?: string;
  modifiedAt?: string | null;
}

export function DocumentTitle({ title, author, state, publishedAt, modifiedAt }: TitleProps) {
  verifyState(state);
  verifyPublishedAt(state, publishedAt);
  const showModifiedAt = shouldShowModifiedAt(publishedAt, modifiedAt);

  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-xl sm:text-2xl md:text-3xl font-extrabold text-center">{title}</div>
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        {author && (
          <div className="flex items-center gap-1">
            <Avatar person={author} size="tiny" /> {author.fullName}
          </div>
        )}

        {state !== "draft" && (
          <>
            {author && <BulletDot margin="mx-0.5" />}
            <span>Posted</span>
            <FormattedTime time={publishedAt!} format="relative-time-or-date" />
          </>
        )}

        {state !== "draft" && showModifiedAt && (
          <>
            <BulletDot margin="mx-0.5" />
            <span>Edited</span>
            <FormattedTime time={modifiedAt!} format="relative-time-or-date" />
          </>
        )}
      </div>
    </div>
  );
}

function verifyState(state: string) {
  if (!validStates.includes(state)) {
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
