import React from "react";

import { BlackLink, DivLink } from "../Link";
import { FormattedTime } from "../FormattedTime";
import { IconCalendar, IconChevronRight, IconFlag, IconMessage, IconSquare } from "../icons";
import { StatusBadge } from "../StatusBadge";
import { createTestId } from "../TestableElement";

import { ReviewPageV2 } from ".";

const TYPE_ICON: Partial<Record<ReviewPageV2.AssignmentType, typeof IconSquare>> = {
  check_in: IconMessage,
  goal_update: IconMessage,
  milestone: IconFlag,
  project_task: IconSquare,
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
  return (
    <div className="flex flex-col">
      <GroupHeader origin={group.origin} />

      <div className="flex flex-col gap-1">
        {group.assignments.map((assignment) => (
          <AssignmentRow key={assignment.resourceId} assignment={assignment} />
        ))}
      </div>
    </div>
  );
}

function GroupHeader({ origin }: { origin: ReviewPageV2.AssignmentOrigin }) {
  return (
    <div className="flex items-center gap-2 text-sm mb-3">
      {origin.spaceName ? (
        <>
          <span className="text-content-dimmed">{origin.spaceName}</span>
          <IconChevronRight size={10} className="text-content-dimmed" />
        </>
      ) : null}
      <span className="text-content-dimmed">{origin.type === "project" ? "Project" : "Goal"}</span>
      <IconChevronRight size={10} className="text-content-dimmed" />
      <div className="flex flex-wrap items-center gap-2">
        <BlackLink
          to={origin.path}
          underline="hover"
          testId={createTestId("origin", origin.id)}
          className="font-medium text-content-strong"
        >
          {origin.name}
        </BlackLink>

        {origin.dueDate ? (
          <span className="flex items-center gap-1 text-xs text-content-dimmed">
            <IconCalendar size={12} />
            <FormattedTime time={origin.dueDate} format="short-date" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: ReviewPageV2.AssignmentWithMeta }) {
  const displayLabel = assignment.actionLabel ?? assignment.name;
  const urgencyBadgeProps = getUrgencyBadgeProps(assignment.dueStatus, assignment.dueDate);

  return (
    <DivLink
      to={assignment.path}
      className="group relative flex items-center gap-3 py-2 px-2 transition-colors hover:bg-surface-highlight rounded"
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
          {urgencyBadgeProps && <StatusBadge {...urgencyBadgeProps} />}
        </div>
      </div>
    </DivLink>
  );
}

function renderLeadingIndicator(assignment: ReviewPageV2.AssignmentWithMeta) {
  const Icon = TYPE_ICON[assignment.type] ?? IconSquare;
  return <Icon size={16} className="text-content-base" />;
}

function getUrgencyBadgeProps(status: ReviewPageV2.DueStatus, dueDate: Date | null) {
  // Only show urgency badges for overdue and due soon items
  if (!dueDate || (status !== "overdue" && status !== "due_today" && status !== "due_soon")) {
    return null;
  }

  switch (status) {
    case "overdue":
      const daysOverdue = calculateDaysOverdue(dueDate);
      const overdueText = daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
      return { status: "missed" as const, hideIcon: true, customLabel: overdueText };
    case "due_today":
      return { status: "caution" as const, hideIcon: true, customLabel: "Due today" };
    case "due_soon":
      return { status: "caution" as const, hideIcon: true, customLabel: "Due tomorrow" };
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
