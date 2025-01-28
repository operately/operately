import React from "react";

import { IconTarget, IconHexagons } from "@tabler/icons-react";
import { ReviewAssignment, AssignmentType } from "@/models/assignments";

import FormattedTime from "@/components/FormattedTime";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { parseDate, relativeDay } from "@/utils/time";

export function AssignmentsHeader({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h2 className="text-xl font-semibold text-content-accent mb-1">{title}</h2>
      <p className="text-content-dimmed text-sm mb-4">{description}</p>
    </>
  );
}

export function AssignmentsList({ assignments }: { assignments: ReviewAssignment[] }) {
  return (
    <div className="flex flex-col">
      {assignments.map((assignment) => (
        <AssignmentItem assignment={assignment} key={assignment.id} />
      ))}
    </div>
  );
}

function AssignmentItem({ assignment }: { assignment: ReviewAssignment }) {
  const { link } = parseInformation(assignment);
  const navigate = useNavigateTo(link);

  return (
    <div
      onClick={navigate}
      className="flex gap-4 items-center pt-6 pb-6 border-b first:border-t hover:cursor-pointer group"
    >
      <DueDate date={assignment.due!} />
      <div className="flex gap-4 items-start">
        <AssignmentIcon type={assignment.type as AssignmentType} />
        <AssignmentInfo assignment={assignment} />
      </div>
    </div>
  );
}

function DueDate({ date }: { date: string }) {
  const daysAgo = relativeDay(parseDate(date)!);
  const isRed = !["Today", "Yesterday"].includes(daysAgo);

  return (
    <div className="flex flex-col min-w-[110px]">
      <b>
        <FormattedTime time={date} format="short-date" />
      </b>
      <span className={`text-sm ${isRed ? "text-content-error" : "text-content-dimmed"}`}>{daysAgo}</span>
    </div>
  );
}

function AssignmentIcon({ type }: { type: AssignmentType }) {
  const SIZE = 26;
  const GOAL_COLOR = "text-red-500 shrink-0";
  const PROJECT_COLOR = "text-indigo-500 shrink-0";

  switch (type) {
    case "project":
      return <IconHexagons size={SIZE} className={PROJECT_COLOR} />;
    case "check_in":
      return <IconHexagons size={SIZE} className={PROJECT_COLOR} />;
    case "goal_update":
      return <IconTarget size={SIZE} className={GOAL_COLOR} />;
    case "goal":
      return <IconTarget size={SIZE} className={GOAL_COLOR} />;
  }
}

function AssignmentInfo({ assignment }: { assignment: ReviewAssignment }) {
  const { title, content } = parseInformation(assignment);

  return (
    <div data-test-id={assignment.id}>
      <p className="mb-1 transition-colors duration-300 group-hover:text-link-base">
        <b>{title}</b> {assignment.name}
      </p>
      {content && (
        <p className="text-sm">
          {assignment.championName} {content}
        </p>
      )}
    </div>
  );
}

function parseInformation(assignment: ReviewAssignment) {
  switch (assignment.type as AssignmentType) {
    case "project":
      return {
        title: "Write the weekly check-in:",
        link: Paths.projectCheckInNewPath(assignment.id!),
      };
    case "goal":
      return {
        title: "Update progress:",
        link: Paths.goalProgressUpdateNewPath(assignment.id!),
      };
    case "check_in":
      return {
        title: "Review:",
        content: "submitted a weekly check-in",
        link: Paths.projectCheckInPath(assignment.id!),
      };
    case "goal_update":
      return {
        title: "Review:",
        content: "submitted an update",
        link: Paths.goalProgressUpdatePath(assignment.id!),
      };
  }
}
