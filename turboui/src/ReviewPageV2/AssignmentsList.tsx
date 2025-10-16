import React from "react";

import { BlackLink, DivLink } from "../Link";
import { FormattedTime } from "../FormattedTime";
import { IconCalendar, IconFlag, IconGoalPlain, IconMessage, IconProjectPlain, IconSquare } from "../icons";
import { createTestId } from "../TestableElement";

import { ReviewPageV2 } from ".";

const TYPE_ICON: Partial<Record<ReviewPageV2.AssignmentType, typeof IconSquare>> = {
  check_in: IconMessage,
  goal_update: IconMessage,
  milestone: IconFlag,
  project_task: IconSquare,
};

const ORIGIN_ICON: Record<ReviewPageV2.AssignmentOrigin["type"], typeof IconSquare> = {
  goal: IconGoalPlain,
  project: IconProjectPlain,
};

export function AssignmentGroups({ groups }: { groups: ReviewPageV2.AssignmentGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group, index) => (
        <div key={`${group.origin.type}:${group.origin.id}`} className="relative">
          <AssignmentGroup group={group} />
          {index < groups.length - 1 && <div className="absolute -bottom-4 left-0 right-0 h-px bg-stroke-base" />}
        </div>
      ))}
    </div>
  );
}

function AssignmentGroup({ group }: { group: ReviewPageV2.AssignmentGroup }) {
  const relationship = getGroupRelationshipLabel(group.assignments);

  return (
    <div className="flex flex-col">
      <GroupHeader origin={group.origin} relationship={relationship} />

      <div className="flex flex-col gap-1">
        {group.assignments.map((assignment) => (
          <AssignmentRow key={assignment.resourceId} assignment={assignment} />
        ))}
      </div>
    </div>
  );
}

function GroupHeader({ origin, relationship }: { origin: ReviewPageV2.AssignmentOrigin; relationship: string | null }) {
  const Icon = ORIGIN_ICON[origin.type];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-1.5">
      <BlackLink
        to={origin.path}
        underline="hover"
        testId={createTestId("origin", origin.id)}
        className="font-medium flex items-center gap-2 leading-tight"
      >
        <Icon size={16} />
        <span>{origin.name}</span>
      </BlackLink>
      {relationship ? (
        <span className="text-[10px] font-semibold tracking-wide uppercase text-content-dimmed leading-none relative top-px">
          {relationship}
        </span>
      ) : null}
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: ReviewPageV2.AssignmentWithMeta }) {
  const displayLabel = assignment.actionLabel ?? assignment.name;
  const urgencyDetails = getUrgencyDetails(assignment.dueStatus, assignment.dueDate);

  return (
    <DivLink
      to={assignment.path}
      className="group relative flex items-center gap-3 py-0.5 pl-6 pr-2 transition-colors hover:bg-surface-highlight rounded"
      testId={createTestId("assignment", assignment.resourceId)}
    >
      <div className="flex h-6 w-6 items-center justify-center text-content-base">
        {renderLeadingIndicator(assignment)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-content-strong truncate">{displayLabel}</span>
          {assignment.dueDate && (
            <span className="flex items-center gap-1 text-xs text-content-dimmed">
              <IconCalendar size={12} />
              <FormattedTime time={assignment.dueDate} format="short-date" />
            </span>
          )}
          {urgencyDetails ? (
            <span className={`text-xs font-medium ${urgencyDetails.className}`}>{urgencyDetails.label}</span>
          ) : null}
        </div>
      </div>
    </DivLink>
  );
}

function renderLeadingIndicator(assignment: ReviewPageV2.AssignmentWithMeta) {
  const Icon = TYPE_ICON[assignment.type] ?? IconSquare;
  return <Icon size={16} className="text-content-base" />;
}

function getUrgencyDetails(status: ReviewPageV2.DueStatus, dueDate: Date | null) {
  if (!dueDate || (status !== "overdue" && status !== "due_today" && status !== "due_soon")) {
    return null;
  }

  switch (status) {
    case "overdue":
      const daysOverdue = calculateDaysOverdue(dueDate);
      const overdueText = daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
      return { label: overdueText, className: "text-callout-error-content" };
    case "due_today":
      return { label: "Due today", className: "text-callout-warning-content" };
    case "due_soon":
      return { label: "Due tomorrow", className: "text-callout-warning-content" };
    default:
      return null;
  }
}

function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0); // Start of due date

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays); // At least 1 day overdue
}

function getGroupRelationshipLabel(assignments: ReviewPageV2.AssignmentWithMeta[]): string | null {
  let label: string | null = null;

  assignments.forEach((assignment) => {
    if (label) {
      return;
    }

    if (assignment.role === "reviewer") {
      label = "REVIEWER";
      return;
    }

    if (assignment.type === "project_task") {
      label = "CONTRIBUTOR";
      return;
    }

    label = "CHAMPION";
  });

  return label;
}
