import React from "react";

import { ReviewAssignment, AssignmentType } from "@/models/assignments";

import FormattedTime from "@/components/FormattedTime";
import { parseDate, relativeDay } from "@/utils/time";
import { match } from "ts-pattern";
import { DivLink, IconTarget, IconHexagons } from "turboui";
import classNames from "classnames";
import { assertPresent } from "@/utils/assertions";

export function AssignmentsList({ assignments }: { assignments: ReviewAssignment[] }) {
  return (
    <div className="flex flex-col mt-4">
      {assignments.map((assignment) => (
        <AssignmentItem assignment={assignment} key={assignment.resourceId} />
      ))}
    </div>
  );
}

function AssignmentItem({ assignment }: { assignment: ReviewAssignment }) {
  assertPresent(assignment.path, "path must be present in assingment");
  const testId = `assignment-${assignment.resourceId}`;

  const className = classNames(
    "flex gap-4 items-center",
    "p-1.5 -mx-1.5",
    "hover:cursor-pointer",
    "hover:bg-surface-highlight",
  );

  return (
    <DivLink to={assignment.path} className={className} testId={testId}>
      <DueDate date={assignment.due!} />

      <div className="flex gap-4 items-center">
        <AssignmentIcon type={assignment.type as AssignmentType} />
        <AssignmentInfo assignment={assignment} />
      </div>
    </DivLink>
  );
}

function DueDate({ date }: { date: string }) {
  const daysAgo = relativeDay(parseDate(date)!);
  const isRed = !["Today", "Yesterday"].includes(daysAgo);

  return (
    <div className="flex flex-col min-w-[110px] text-sm font-medium uppercase">
      <FormattedTime time={date} format="short-date" />
      <span className={`text-xs ${isRed ? "text-content-error" : "text-content-dimmed"}`}>{daysAgo}</span>
    </div>
  );
}

const ICON_SIZE = 20;
const GOAL_COLOR = "text-red-500 shrink-0";
const PROJECT_COLOR = "text-indigo-500 shrink-0";

function AssignmentIcon({ type }: { type: AssignmentType }) {
  return match(type)
    .with("project", () => <IconHexagons size={ICON_SIZE} className={PROJECT_COLOR} />)
    .with("check_in", () => <IconHexagons size={ICON_SIZE} className={PROJECT_COLOR} />)
    .with("goal_update", () => <IconTarget size={ICON_SIZE} className={GOAL_COLOR} />)
    .with("goal", () => <IconTarget size={ICON_SIZE} className={GOAL_COLOR} />)
    .exhaustive();
}

function AssignmentInfo({ assignment }: { assignment: ReviewAssignment }) {
  return match(assignment.type as AssignmentType)
    .with("project", () => <DueProjectCheckIn assignment={assignment} />)
    .with("check_in", () => <AcknowledgeProjectCheckIn assignment={assignment} />)
    .with("goal", () => <DueGoalUpdate assignment={assignment} />)
    .with("goal_update", () => <AcknowledgeGoalUpdate assignment={assignment} />)
    .exhaustive();
}

function DueProjectCheckIn({ assignment }: { assignment: ReviewAssignment }) {
  return (
    <div>
      <span className="font-bold">Write the weekly check-in:</span> {assignment.name}
    </div>
  );
}

function AcknowledgeProjectCheckIn({ assignment }: { assignment: ReviewAssignment }) {
  return (
    <div>
      <div>
        <span className="font-bold">Review:</span> {assignment.name}
      </div>

      <p className="text-xs">{assignment.authorName} submitted a weekly check-in</p>
    </div>
  );
}

function DueGoalUpdate({ assignment }: { assignment: ReviewAssignment }) {
  return (
    <div>
      <span className="font-bold">Update progress:</span> {assignment.name}
    </div>
  );
}

function AcknowledgeGoalUpdate({ assignment }: { assignment: ReviewAssignment }) {
  return (
    <div>
      <div>
        <span className="font-bold">Review:</span> {assignment.name}
      </div>
      <p className="text-xs">{assignment.authorName} submitted an update</p>
    </div>
  );
}
