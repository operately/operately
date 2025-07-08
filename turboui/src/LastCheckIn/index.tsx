import React from "react";
import FormattedTime from "../FormattedTime";
import classNames from "../utils/classnames";
import { Avatar } from "../Avatar";
import { DivLink } from "../Link";
import { Summary } from "../RichContent";
import { StatusBadge } from "../StatusBadge";
import { BadgeStatus } from "../StatusBadge/types";
import { MentionedPersonLookupFn } from "../RichEditor";

export interface LastCheckInProps {
  checkIns: CheckIn[];
  state?: "active" | "closed";
  mentionedPersonLookup?: MentionedPersonLookupFn;
}

export interface CheckIn {
  id: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  date: Date;
  content: string;
  link: string;
  commentCount: number;
  status: BadgeStatus;
}

export function LastCheckIn({ checkIns, state, mentionedPersonLookup }: LastCheckInProps) {
  if (checkIns.length === 0) return null;
  if (state === "closed") return null;

  const checkIn = checkIns[0]!;

  let borderColor = "";

  if (checkIn.status === "on_track") {
    borderColor = "border-green-500";
  } else if (checkIn.status === "caution") {
    borderColor = "border-yellow-500";
  } else if (checkIn.status === "off_track") {
    borderColor = "border-red-500";
  }

  const className = classNames(
    "flex gap-1 flex-col",
    "cursor-pointer text-sm py-3 pl-3 pr-4",
    "border-l-4",
    "bg-zinc-50 dark:bg-zinc-800",
    "hover:bg-zinc-100 dark:hover:bg-zinc-700",
    borderColor,
  );

  return (
    <div className="text-sm">
      <DivLink to={checkIn.link} className={className}>
        <div className="flex items-center font-semibold">
          <FormattedTime time={checkIn.date} format="short-date" />
        </div>

        <Summary
          content={checkIn.content}
          characterCount={130}
          mentionedPersonLookup={mentionedPersonLookup || (async () => null)}
        />

        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar person={checkIn.author} size={20} />
            {checkIn.author.fullName.split(" ")[0]}
          </div>
          <StatusBadge status={checkIn.status} hideIcon className="scale-95 inline-block shrink-0 align-[5px]" />
        </div>
      </DivLink>
    </div>
  );
}
