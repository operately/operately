import React from "react";

import { MentionedPersonLookupFn } from "../RichEditor";
import classNames from "../utils/classnames";
import { DivLink } from "../Link";
import { Avatar, AvatarPerson } from "../Avatar";
import { Summary } from "../RichContent";
import FormattedTime from "../FormattedTime";
import { CommentCountIndicator } from "../CommentCountIndicator";
import { StatusBadge, BadgeStatus } from "../StatusBadge";

namespace CheckInCard {
  interface CheckIn {
    link: string;
    author: AvatarPerson;
    date: Date;
    content: string;
    commentCount: number;
    status: BadgeStatus;
  }

  export interface Props {
    checkIn: CheckIn;
    mentionedPersonLookup: MentionedPersonLookupFn;
  }
}

export function CheckInCard({ checkIn, mentionedPersonLookup }: CheckInCard.Props) {
  const className = classNames(
    "flex gap-4 items-center",
    "py-3 px-3",
    "last:border-b border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
  );

  return (
    <DivLink to={checkIn.link} className={className}>
      <div className="flex gap-4 flex-1">
        <div className="shrink-0">
          <Avatar person={checkIn.author} size="large" />
        </div>

        <div className="flex-1 h-full">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold leading-none">Check-In for {getMonth(checkIn.date)}</div>
            <StatusBadge status={checkIn.status} hideIcon className="scale-95 inline-block shrink-0" />
          </div>
          <div className="break-words">
            <Summary content={checkIn.content} characterCount={130} mentionedPersonLookup={mentionedPersonLookup} />
          </div>

          <div className="flex gap-1 mt-1 text-xs">
            <div className="text-sm text-content-dimmed">{checkIn.author.fullName}</div>
            <div className="text-sm text-content-dimmed">·</div>
            <div className="text-sm text-content-dimmed">
              <FormattedTime time={checkIn.date} format="relative-weekday-or-date" />
            </div>
          </div>
        </div>
      </div>

      <CommentCountIndicator count={checkIn.commentCount} size={28} />
    </DivLink>
  );
}

function getMonth(date: Date) {
  const year = date.getFullYear();
  const thisYear = new Date().getFullYear();

  if (year === thisYear) {
    const options: Intl.DateTimeFormatOptions = { month: "long" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } else {
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }
}
