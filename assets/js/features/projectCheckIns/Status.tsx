import * as React from "react";
import * as People from "@/models/people";

import classNames from "classnames";

const COLORS = {
  on_track: "green",
  caution: "yellow",
  issue: "red",
};

const TITLES = {
  on_track: "On Track",
  caution: "Caution",
  issue: "Issue",
};

const CIRCLE_BORDER_COLORS = {
  green: "border-green-600",
  yellow: "border-yellow-400",
  red: "border-red-500",
};

const CIRCLE_BACKGROUND_COLORS = {
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

interface StatusProps {
  status: string;
  reviewer?: People.Person;
  selectable?: boolean;
  onSelected?: () => void;
}

export function Status({ status, reviewer, selectable, onSelected }: StatusProps) {
  const color = COLORS[status];
  const title = TITLES[status];
  const description = <StatusDescription status={status} reviewer={reviewer} />;

  const className = classNames("flex items-center gap-4 p-2", {
    "hover:bg-surface-highlight cursor-pointer": selectable,
  });

  return (
    <div className={className} onClick={onSelected}>
      <Circle color={color} />

      <div>
        <p className="font-bold">{title}</p>
        <div className="text-sm">{description}</div>
      </div>
    </div>
  );
}

function StatusDescription({ status, reviewer }: { status: string; reviewer?: People.Person }) {
  const reviewerMention = reviewer ? People.firstName(reviewer) : "the reviewer";

  switch (status) {
    case "on_track":
      return (
        <>
          Work is progressing as planned.
          <br />
          No involvement by {reviewerMention} is needed at this time.
        </>
      );
    case "caution":
      return (
        <>
          A potential problem may exist, perhaps in the future, if not monitored.
          <br />
          <span className="capitalize">{reviewerMention}</span> should be aware, but no action is needed.
        </>
      );
    case "issue":
      return (
        <>
          There’s a problem that may significantly affect time, cost, quality, or scope.
          <br />
          <span className="capitalize">{reviewerMention}</span>’s involvement is necessary.
        </>
      );

    default:
      throw new Error(`Unknown status: ${status}`);
  }
}

function Circle({ color }: { color: "green" | "yellow" | "red" }) {
  const borderColor = CIRCLE_BORDER_COLORS[color];
  const backgroundColor = CIRCLE_BACKGROUND_COLORS[color];

  const outerClassName = classNames(
    "w-10 h-10",
    "rounded-full",
    "flex items-center justify-center",
    "border-2",
    "p-0.5",
    borderColor,
  );
  const innerClassName = classNames("w-full h-full", "rounded-full", backgroundColor);

  return (
    <div className={outerClassName}>
      <div className={innerClassName}></div>
    </div>
  );
}
