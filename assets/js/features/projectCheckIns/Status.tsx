import * as React from "react";
import * as People from "@/models/people";

import classNames from "classnames";
import { COLORS, TITLES, CIRCLE_BORDER_COLORS, CIRCLE_BACKGROUND_COLORS } from "./constants";

interface StatusProps {
  status: string;
  reviewer?: People.Person;
  selectable?: boolean;
  onSelected?: () => void;
  testId?: string;
}

export function Status({ status, reviewer, selectable, onSelected, testId }: StatusProps) {
  const color = COLORS[status];
  const title = TITLES[status];
  const description = <StatusDescription status={status} reviewer={reviewer} />;

  const className = classNames("flex items-center gap-2 p-2", {
    "hover:bg-surface-highlight cursor-pointer": selectable,
  });

  return (
    <div className={className} onClick={onSelected} data-test-id={testId}>
      <Circle color={color} />

      <div>
        <p className="font-bold">{title}</p>
        <div className="text-sm">{description}</div>
      </div>
    </div>
  );
}

export function Placeholder() {
  return (
    <div className="flex items-center gap-2 p-2 text-content-dimmed">
      <div className="w-10 h-10 rounded-full border-2 border-surface-base border-dashed" />

      <div>
        <p className="font-semibold">Select a status</p>
        <div className="text-sm">Choose from the available options</div>
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
