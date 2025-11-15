import * as React from "react";

import { differenceInCalendarDays, isValid, startOfDay } from "date-fns";

import { PageNew } from "../Page";
import { IconCoffee, IconInfoCircle, IconSparkles } from "../icons";
import { parseDate } from "../utils/time";
import { TestableElement } from "../TestableElement";
import { Tooltip } from "../Tooltip";

import { AssignmentGroups } from "./AssignmentsList";

const DUE_SOON_WINDOW_IN_DAYS = 1;

export namespace ReviewPageV2 {
  export type AssignmentRole = "owner" | "reviewer";
  export type AssignmentType = "check_in" | "goal_update" | "project_task" | "milestone";
  export type OriginType = "project" | "goal";

  export interface AssignmentOrigin {
    id: string;
    name: string;
    type: OriginType;
    path: string;
    spaceName?: string | null;
    dueDate?: string | null;
  }

  export type TaskStatus = "pending" | "todo" | "in_progress" | "done" | "canceled";

  export interface Assignment {
    resourceId: string;
    name: string;
    due: string | null;
    type: AssignmentType;
    role: AssignmentRole;
    actionLabel: string | null;
    path: string;
    origin: AssignmentOrigin;
    taskStatus: TaskStatus | null;
    authorId?: string | null;
    authorName?: string | null;
    description?: string | null;
  }

  export type DueStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "none";

  export interface AssignmentWithMeta extends Assignment {
    dueDate: Date | null;
    dueStatus: DueStatus;
    dueStatusLabel: string;
  }

  export interface AssignmentGroup {
    origin: AssignmentOrigin;
    assignments: AssignmentWithMeta[];
  }

  export interface CategorizedAssignments {
    dueSoon: AssignmentGroup[];
    needsReview: AssignmentGroup[];
    upcoming: AssignmentGroup[];
  }

  export interface Props {
    assignments: Assignment[];
    assignmentsCount?: number;
    showUpcomingSection?: boolean;
  }
}

export function ReviewPage(props: ReviewPageV2.Props) {
  const assignments = props.assignments || [];
  const showUpcomingSection = props.showUpcomingSection ?? true;
  const categorized = React.useMemo(() => categorizeAssignments(assignments), [assignments]);

  const urgentGroups = React.useMemo(() => {
    const dueSoonAssignments = categorized.dueSoon.flatMap((group) => group.assignments);
    const reviewAssignments = categorized.needsReview.flatMap((group) => group.assignments);

    if (dueSoonAssignments.length === 0 && reviewAssignments.length === 0) {
      return [];
    }

    return groupAssignmentsByOrigin([...dueSoonAssignments, ...reviewAssignments]);
  }, [categorized]);

  const hasUrgent = urgentGroups.length > 0;
  const hasUpcoming = showUpcomingSection && categorized.upcoming.length > 0;
  const hasAnyAssignments = hasUrgent || hasUpcoming;

  // Count only urgent items (due soon + needs review), not upcoming
  const urgentCount =
    categorized.dueSoon.reduce((sum, group) => sum + group.assignments.length, 0) +
    categorized.needsReview.reduce((sum, group) => sum + group.assignments.length, 0);

  const pageTitle = urgentCount === 0 ? "Review" : `Review (${urgentCount})`;

  return (
    <PageNew title={pageTitle} size="fullwidth" testId="review-page">
      <div className="p-4 max-w-3xl mx-auto md:my-6 overflow-auto">
        <Header assignmentsCount={urgentCount} />

        <div className="flex flex-col mt-8 gap-6">
          {hasAnyAssignments ? (
            <>
              {hasUrgent && <AssignmentGroups groups={urgentGroups} />}

              {hasUpcoming && (
                <Section
                  title="My upcoming work"
                  description="Work assigned to you with future due dates, sorted chronologically."
                  groups={categorized.upcoming}
                  testId="upcoming-section"
                />
              )}
            </>
          ) : (
            <CaughtUpState />
          )}
        </div>
      </div>
    </PageNew>
  );
}

function Header({ assignmentsCount }: { assignmentsCount: number }) {
  const headline =
    assignmentsCount > 0
      ? `${assignmentsCount} outstanding ${assignmentsCount === 1 ? "item" : "items"}`
      : "All caught up";

  return (
    <div className="mt-4 pr-4" data-test-id="page-header">
      <div className="flex items-center gap-3 border-b border-surface-outline pb-3">
        <div className="w-12 h-12 flex-shrink-0 bg-brand-2 rounded-lg flex items-center justify-center">
          <IconCoffee size={20} className="text-brand-1" />
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold text-content-strong">Review</h1>
            <span className="text-sm text-content-dimmed">{headline}</span>
          </div>
          <p className="text-sm text-content-dimmed mt-1">
            Catch up on work that's due soon or waiting for your review.
          </p>
        </div>
      </div>
    </div>
  );
}

interface SectionProps extends TestableElement {
  title: string;
  description?: string;
  infoTooltip?: string;
  groups: ReviewPageV2.AssignmentGroup[];
}

function Section({ title, description, infoTooltip, groups, testId }: SectionProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section data-test-id={testId}>
      <div className="px-4 py-4">
        <div className="border-b border-surface-outline mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-content-strong">{title}</h2>
            {infoTooltip ? (
              <Tooltip content={infoTooltip} delayDuration={150}>
                <button
                  type="button"
                  aria-label={`More information about ${title}`}
                  className="inline-flex items-center justify-center text-content-dimmed hover:text-content-strong"
                >
                  <IconInfoCircle size={14} className="relative top-px" />
                </button>
              </Tooltip>
            ) : null}
          </div>
          {description ? <p className="text-sm text-content-base mb-4">{description}</p> : null}
        </div>

        <AssignmentGroups groups={groups} />
      </div>
    </section>
  );
}

function CaughtUpState() {
  return (
    <div className="py-10 flex justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-surface-outline bg-surface-base px-8 py-14 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-callout-success-bg">
          <IconSparkles size={20} className="text-callout-success-content" />
        </div>
        <p className="text-lg font-semibold text-content-strong">You're all caught up</p>
        <p className="text-sm text-content-dimmed">
          No assignments, check-ins, milestones, or reviews need your attention right now.
        </p>
      </div>
    </div>
  );
}

function categorizeAssignments(assignments: ReviewPageV2.Assignment[]): ReviewPageV2.CategorizedAssignments {
  const enrichedAssignments = assignments.map(enrichAssignment);

  const ownerAssignments = enrichedAssignments.filter((assignment) => assignment.role === "owner");
  const reviewerAssignments = enrichedAssignments.filter((assignment) => assignment.role === "reviewer");

  const dueSoonAssignments = ownerAssignments.filter((assignment) => isDueSoon(assignment.dueStatus));
  const upcomingAssignments = ownerAssignments.filter((assignment) => isUpcoming(assignment.dueStatus));

  return {
    dueSoon: groupAssignmentsByOrigin(dueSoonAssignments),
    needsReview: groupAssignmentsByOrigin(reviewerAssignments),
    upcoming: groupAssignmentsByOrigin(upcomingAssignments),
  };
}

function enrichAssignment(assignment: ReviewPageV2.Assignment): ReviewPageV2.AssignmentWithMeta {
  const dueDate = safeParseDate(assignment.due);
  const { status, label } = resolveDueStatus(dueDate);

  return {
    ...assignment,
    dueDate,
    dueStatus: status,
    dueStatusLabel: label,
  };
}

function safeParseDate(value: string | null): Date | null {
  if (!value) return null;

  try {
    const parsed = parseDate(value);
    return parsed && isValid(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function resolveDueStatus(dueDate: Date | null): { status: ReviewPageV2.DueStatus; label: string } {
  if (!dueDate || !isValid(dueDate)) {
    return { status: "none", label: "No due date" };
  }

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);
  const diff = differenceInCalendarDays(dueDay, today);

  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      status: "overdue",
      label: days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`,
    };
  }

  if (diff === 0) {
    return { status: "due_today", label: "Due today" };
  }

  if (diff === 1) {
    return { status: "due_soon", label: "Due tomorrow" };
  }

  if (diff <= DUE_SOON_WINDOW_IN_DAYS) {
    return { status: "due_soon", label: `Due in ${diff} days` };
  }

  return { status: "upcoming", label: `Due in ${diff} days` };
}

function isDueSoon(status: ReviewPageV2.DueStatus) {
  return status === "overdue" || status === "due_today" || status === "due_soon";
}

function isUpcoming(status: ReviewPageV2.DueStatus) {
  return status === "upcoming" || status === "none";
}

const DUE_STATUS_RANK: Record<ReviewPageV2.DueStatus, number> = {
  overdue: 0,
  due_today: 1,
  due_soon: 2,
  upcoming: 3,
  none: 4,
};

function groupAssignmentsByOrigin(assignments: ReviewPageV2.AssignmentWithMeta[]): ReviewPageV2.AssignmentGroup[] {
  const groups = new Map<string, ReviewPageV2.AssignmentGroup>();

  assignments.forEach((assignment) => {
    const key = `${assignment.origin.type}:${assignment.origin.id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        origin: assignment.origin,
        assignments: [],
      });
    }

    groups.get(key)!.assignments.push(assignment);
  });

  const result = Array.from(groups.values());

  result.forEach((group) => {
    group.assignments.sort(compareAssignments);
  });

  result.sort((a, b) => compareGroups(a, b));

  return result;
}

function compareAssignments(a: ReviewPageV2.AssignmentWithMeta, b: ReviewPageV2.AssignmentWithMeta) {
  const statusDiff = DUE_STATUS_RANK[a.dueStatus] - DUE_STATUS_RANK[b.dueStatus];
  if (statusDiff !== 0) return statusDiff;

  return compareDates(a.dueDate, b.dueDate);
}

function compareGroups(a: ReviewPageV2.AssignmentGroup, b: ReviewPageV2.AssignmentGroup) {
  const firstA = a.assignments[0];
  const firstB = b.assignments[0];

  if (!firstA && !firstB) return 0;
  if (!firstA) return 1;
  if (!firstB) return -1;

  const statusDiff = DUE_STATUS_RANK[firstA.dueStatus] - DUE_STATUS_RANK[firstB.dueStatus];
  if (statusDiff !== 0) return statusDiff;

  const dateDiff = compareDates(firstA.dueDate, firstB.dueDate);
  if (dateDiff !== 0) return dateDiff;

  return a.origin.name.localeCompare(b.origin.name);
}

function compareDates(a: Date | null, b: Date | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  if (a.getTime() === b.getTime()) return 0;
  return a.getTime() < b.getTime() ? -1 : 1;
}
