import * as React from "react";

import { PageNew } from "../Page";
import { IconCoffee, IconInfoCircle, IconSparkles } from "../icons";
import { TestableElement } from "../TestableElement";
import { Tooltip } from "../Tooltip";

import { AssignmentGroups } from "./AssignmentsList";
import { mergeUrgentGroups } from "./utils";

export namespace ReviewPageV2 {
  export type AssignmentRole = "owner" | "reviewer";
  export type AssignmentType = "check_in" | "goal_update" | "space_task" | "project_task" | "milestone";
  export type OriginType = "project" | "goal" | "space";
  export type DueStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "none";

  export interface AssignmentOrigin {
    id: string;
    name: string;
    type: OriginType;
    path: string;
    spaceName?: string | null;
    dueDate?: string | null;
  }

  export interface Assignment {
    resourceId: string;
    name: string;
    due: string | null;
    type: AssignmentType;
    role: AssignmentRole;
    actionLabel: string | null;
    path: string;
    origin: AssignmentOrigin;
    taskStatus: string | null;
    authorId?: string | null;
    authorName?: string | null;
    description?: string | null;
    dueDate: string | null;
    dueStatus: DueStatus | null;
    dueStatusLabel: string | null;
  }

  export interface AssignmentGroup {
    origin: AssignmentOrigin;
    assignments: Assignment[];
  }

  export interface Props {
    dueSoon: AssignmentGroup[];
    needsReview: AssignmentGroup[];
    upcoming: AssignmentGroup[];
  }
}

export function ReviewPage(props: ReviewPageV2.Props) {
  const { dueSoon, needsReview, upcoming } = props;

  // Merge due_soon and needs_review while maintaining backend's sort order
  const urgentGroups = React.useMemo(
    () => mergeUrgentGroups(dueSoon, needsReview),
    [dueSoon, needsReview]
  );

  const hasUrgent = urgentGroups.length > 0;
  const hasUpcoming = upcoming.length > 0;
  const hasAnyAssignments = hasUrgent || hasUpcoming;

  // Count only urgent items (due soon + needs review), not upcoming
  const urgentCount = urgentGroups.reduce((sum, group) => sum + group.assignments.length, 0);

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
                  groups={upcoming}
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
