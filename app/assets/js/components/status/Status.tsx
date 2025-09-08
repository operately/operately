import * as React from "react";
import * as People from "@/models/people";

import classNames from "classnames";
import { ColorOptions, StatusOptions } from ".";
import { COLORS, TITLES, CIRCLE_BORDER_COLORS, CIRCLE_BACKGROUND_COLORS } from "./constants";

interface StatusProps {
  status: StatusOptions;
  reviewer?: People.Person | null;
  selectable?: boolean;
  onSelected?: () => void;
  testId?: string;
}

export function Status({ status, reviewer, selectable, onSelected, testId }: StatusProps) {
  const color = COLORS[status] as ColorOptions;
  const title = TITLES[status];
  const description = <StatusDescription status={status} reviewer={reviewer} />;

  const className = classNames("flex items-center gap-2 p-2", {
    "hover:bg-surface-highlight cursor-pointer": selectable,
  });

  return (
    <div className={className} onClick={onSelected} data-test-id={testId}>
      <div>
        <Circle color={color} />
      </div>

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
      <div className="w-10 h-10 rounded-full border-2 border-surface-outline border-dashed" />

      <div>
        <p className="font-semibold">Select a status</p>
        <div className="text-sm">Choose from the available options</div>
      </div>
    </div>
  );
}

function StatusDescription({ status, reviewer }: { status: StatusOptions; reviewer?: People.Person | null }) {
  const reviewerName = reviewer && People.firstName(reviewer);

  switch (status) {
    case "on_track":
      return <>Progressing as planned. No blockers.</>;
    case "caution":
      return <>Emerging risks or delays. {reviewerName || "The reviewer"} should be aware.</>;
    case "off_track":
      return <>Significant problems affecting success. {reviewerName || "The reviewer"}’s help is needed.</>;
    case "pending":
      return <>Work hasn't started yet.</>;

    default:
      throw new Error(`Unknown status: ${status}`);
  }
}

function Circle({ color }: { color: ColorOptions }) {
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
