import React from "react";
import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import { PrimaryButton } from "../Button";
import FormattedTime from "../FormattedTime";
import { DivLink } from "../Link";
import { Summary } from "../RichContent";
import { MentionedPersonLookupFn } from "../RichEditor";
import classNames from "../utils/classnames";

export function CheckIns(props: GoalPage.Props) {
  return (
    <div className="p-4 max-w-3xl mx-auto my-6">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-lg">Check-Ins</h2>
          <div className="flex items-center gap-2 text-sm">
            Operately ask the champion to check-in at least once a month.
          </div>
        </div>

        {props.canEdit && (
          <PrimaryButton linkTo={props.newCheckInLink} size="xs">
            Check-In Now
          </PrimaryButton>
        )}
      </div>

      <div className="space-y-4 mt-8">
        {props.checkIns.map((checkIn) => (
          <CheckIn key={checkIn.id} checkIn={checkIn} mentionedPersonLookup={props.mentionedPersonLookup} />
        ))}
      </div>
    </div>
  );
}

export function CheckIn({
  checkIn,
  mentionedPersonLookup,
}: {
  checkIn: GoalPage.CheckIn;
  mentionedPersonLookup: MentionedPersonLookupFn;
}) {
  const className = classNames(
    "flex gap-4",
    "py-3 px-3",
    "last:border-b border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
  );

  return (
    <DivLink to={checkIn.link} className={className}>
      <div className="shrink-0">
        <Avatar person={checkIn.author} size="large" />
      </div>

      <div className="flex-1 h-full">
        <div className="font-semibold leading-none mb-1">Check-In for {getMonth(checkIn.date!)}</div>
        <div className="break-words">
          <Summary content={checkIn.content} characterCount={130} mentionedPersonLookup={mentionedPersonLookup} />
        </div>

        <div className="flex gap-1 mt-1 text-xs">
          <div className="text-sm text-content-dimmed">{checkIn.author.fullName}</div>
          <div className="text-sm text-content-dimmed">·</div>
          <div className="text-sm text-content-dimmed">
            <FormattedTime time={checkIn.date!} format="relative-weekday-or-date" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <CommentsCountIndicator count={4} size={28} />
      </div>
    </DivLink>
  );
}

function CommentsCountIndicator({ count, size }: { count: number; size: number }) {
  if (count < 1) return <></>;

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.6,
    fontWeight: size > 20 ? "normal" : "bold",
  };

  const className = "bg-blue-500 text-white-1 flex items-center justify-center rounded-full";

  return (
    <div>
      <div className={className} style={style}>
        {count}
      </div>
    </div>
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
