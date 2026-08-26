import React, { useId, useState } from "react";

import { FormattedTime } from "../../FormattedTime";
import type { FormattedTimePreferences } from "../../FormattedTime";
import { BlackLink } from "../../Link";
import { IconChevronDown, IconChevronRight, IconFlagFilled } from "../../icons";
import * as Types from "../types";

interface CompletedMilestonesSectionProps {
  milestones: Types.MilestoneWithStats[];
  formattedTimePreferences: FormattedTimePreferences;
}

export function CompletedMilestonesSection({ milestones, formattedTimePreferences }: CompletedMilestonesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const sectionLabel = `${milestones.length} completed milestone${milestones.length === 1 ? "" : "s"}`;
  const openTaskCount = milestones.reduce(
    (total, milestoneData) =>
      total + Math.max(0, milestoneData.stats.total - milestoneData.stats.done - milestoneData.stats.canceled),
    0,
  );

  return (
    <section className="mt-6" data-test-id="completed-milestones-compact-section">
      <button
        type="button"
        data-test-id="completed-milestones-toggle"
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-content-dimmed transition-colors hover:bg-surface-dimmed hover:text-content-base"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-controls={contentId}
        aria-expanded={isExpanded}
      >
        {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        <span>{sectionLabel}</span>
        {openTaskCount > 0 && (
          <span className="text-callout-warning-content">
            · {openTaskCount} open task{openTaskCount === 1 ? "" : "s"}
          </span>
        )}
      </button>

      {isExpanded && (
        <ul id={contentId} className="mt-1 overflow-hidden rounded-md border border-surface-outline bg-surface-base">
          {milestones.map((milestoneData, index) => (
            <CompletedMilestoneRow
              key={milestoneData.milestone.id}
              milestoneData={milestoneData}
              formattedTimePreferences={formattedTimePreferences}
              hasDivider={index > 0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface CompletedMilestoneRowProps {
  milestoneData: Types.MilestoneWithStats;
  formattedTimePreferences: FormattedTimePreferences;
  hasDivider: boolean;
}

function CompletedMilestoneRow({ milestoneData, formattedTimePreferences, hasDivider }: CompletedMilestoneRowProps) {
  const { milestone, stats } = milestoneData;
  const openTaskCount = stats.pending + stats.inProgress;

  return (
    <li
      className={`flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-dimmed ${
        hasDivider ? "border-t border-surface-outline" : ""
      }`}
      data-test-id={`completed-milestone-${milestone.id}`}
    >
      <IconFlagFilled size={16} className="flex-shrink-0 text-accent-1" />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <BlackLink
          to={milestone.link || ""}
          className="min-w-0 truncate text-sm font-medium text-content-base transition-colors md:hover:text-link-hover"
          underline="hover"
          title={milestone.name}
        >
          {milestone.name}
        </BlackLink>

        <div className="flex flex-shrink-0 items-center gap-2 text-xs text-content-dimmed">
          {openTaskCount > 0 && (
            <span className="text-callout-warning-content">
              {openTaskCount} open task{openTaskCount === 1 ? "" : "s"}
            </span>
          )}
          <span>
            {stats.total} task{stats.total === 1 ? "" : "s"}
          </span>
          {milestone.completedAt && (
            <span className="hidden sm:inline">
              Completed <FormattedTime {...formattedTimePreferences} time={milestone.completedAt} format="short-date" />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
