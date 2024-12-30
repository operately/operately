import * as React from "react";
import * as People from "@/models/people";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { TextSeparator } from "@/components/TextSeparator";

const validStates = ["draft", "published"];

interface TitleProps {
  title: string;
  state: string;
  author: People.Person;
  publishedAt?: string;
}

export function DocumentTitle({ title, author, state, publishedAt }: TitleProps) {
  verifyState(state);
  verifyPublishedAt(state, publishedAt);

  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-xl sm:text-2xl md:text-3xl font-extrabold text-center">{title}</div>
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={author!} size="tiny" /> {author!.fullName}
        </div>

        {state !== "draft" && (
          <>
            <TextSeparator />
            <FormattedTime time={publishedAt!} format="relative-time-or-date" />
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
