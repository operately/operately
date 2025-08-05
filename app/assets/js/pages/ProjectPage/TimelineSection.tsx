import * as Milestones from "@/models/milestones";
import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";
import * as React from "react";

import { parseContextualDate } from "@/models/contextualDates";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { Link, SecondaryButton, DateField } from "turboui";
import { DimmedLabel } from "./Label";

import FormattedTime from "@/components/FormattedTime";
import { assertPresent } from "@/utils/assertions";
import { match } from "ts-pattern";

import { usePaths } from "@/routes/paths";

export function TimelineSection({ project }: { project: Projects.Project }) {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">Timeline</div>

          <div className="text-sm">
            <ViewTimelineLink project={project} />
          </div>
        </div>

        <div className="w-4/5">
          <Content project={project} />
        </div>
      </div>
    </div>
  );
}

function ViewTimelineLink({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  return (
    <Link to={paths.projectMilestonesPath(project.id!)} testId="manage-timeline">
      View
    </Link>
  );
}

function Content({ project }: { project: Projects.Project }) {
  return (
    <div>
      <div className="flex items-start gap-12 text-sm mb-6">
        <StartDate project={project} />
        <EndDate project={project} />
        <Progress project={project} />
      </div>

      <ProjectMilestones project={project} />
    </div>
  );
}

function StartDate({ project }: { project: Projects.Project }) {
  const date = parseContextualDate(project.timeframe?.contextualStartDate);

  return (
    <div>
      <DimmedLabel>Start Date</DimmedLabel>
      <div className="font-semibold">
        <DateField date={date} hideCalendarIcon readonly />
      </div>
    </div>
  );
}

function EndDate({ project }: { project: Projects.Project }) {
  const date = parseContextualDate(project.timeframe?.contextualEndDate);

  return (
    <div>
      <DimmedLabel>Due Date</DimmedLabel>
      {project.timeframe?.contextualEndDate ? (
        <div className="font-semibold">
          <DateField date={date} hideCalendarIcon readonly />
        </div>
      ) : (
        <div>
          <span className="text-content-dimmed">No due date</span>
        </div>
      )}
    </div>
  );
}

function Progress({ project }: { project: Projects.Project }) {
  if (project.state === "closed") return <CompletedProgress project={project} />;

  const start = Time.parse(project.timeframe?.contextualStartDate?.date);
  const end = Time.parse(project.timeframe?.contextualEndDate?.date);

  if (!start) return null;
  if (!end) return null;
  if (Time.isFuture(start)) return null;

  if (Projects.isOverdue(project)) {
    return <OverdueProgress end={end} />;
  } else {
    return <OngoingProgress end={end} />;
  }
}

function CompletedProgress({ project }: { project: Projects.Project }) {
  assertPresent(project.closedAt, "project closedAt must be defined");

  return (
    <div>
      <DimmedLabel>Completed On</DimmedLabel>
      <div className="font-semibold">
        <FormattedTime time={project.closedAt} format="short-date" /> <CompletedProgressDiff project={project} />
      </div>
    </div>
  );
}

function CompletedProgressDiff({ project }: { project: Projects.Project }) {
  const closedAt = Time.parseDate(project.closedAt);
  const deadline = Time.parseDate(project.timeframe?.contextualEndDate?.date);

  if (!closedAt) return null;
  if (!deadline) return null;

  let msg = match(Time.compareAsc(closedAt, deadline))
    .with(0, () => "as planned")
    .with(-1, () => Time.durationHumanized(closedAt, deadline, "ahead of schedule"))
    .with(1, () => Time.durationHumanized(deadline, closedAt, "late"))
    .run();

  return <>&mdash; {msg}</>;
}

function OverdueProgress({ end }: { end: Date }) {
  return (
    <div>
      <DimmedLabel>Countdown</DimmedLabel>
      <div className="font-bold text-callout-error-message">{Time.durationHumanized(end, Time.today(), "overdue")}</div>
    </div>
  );
}

function OngoingProgress({ end }: { end: Date }) {
  return (
    <div>
      <DimmedLabel>Countdown</DimmedLabel>
      <div className="font-semibold">{Time.durationHumanized(Time.today(), end, "remaining")}</div>
    </div>
  );
}

function ProjectMilestones({ project }) {
  const milestones = project.milestones || [];

  if (milestones.length === 0) {
    return <MilestonesZeroState project={project} />;
  } else {
    const upcommingMilestones = getUpcommingMilestones(project);

    if (upcommingMilestones.length === 0) {
      return <AllMilestonesCompleted project={project} />;
    } else {
      return <MilestonesList milestones={upcommingMilestones} />;
    }
  }
}

function MilestonesZeroState({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  const editPath = paths.projectEditTimelinePath(project.id!);
  assertPresent(project.permissions, "Project permissions must be defined");

  const editLink = (
    <SecondaryButton linkTo={editPath} testId="add-milestones-link" size="xs">
      Edit Timeline
    </SecondaryButton>
  );

  return (
    <div className="text-sm">
      Outline your project timeline with milestones.
      {project.permissions.canEditMilestone && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function AllMilestonesCompleted({ project }: { project: Projects.Project }) {
  assertPresent(project.permissions, "Project permissions must be defined");

  const paths = usePaths();
  const editLink = (
    <Link to={paths.projectEditTimelinePath(project.id!)} testId="add-milestones-link">
      Add more milestones
    </Link>
  );

  return (
    <div className="text-sm">
      All milestones completed.
      {project.permissions.canEditMilestone && <div className="mt-1 font-bold">{editLink}</div>}
    </div>
  );
}

function MilestonesList({ milestones }: { milestones: Projects.Milestone[] }) {
  return (
    <div>
      <DimmedLabel>Upcoming Milestones</DimmedLabel>

      {milestones.map((milestone) => (
        <MilestoneLink key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function MilestoneLink({ milestone }: { milestone: Projects.Milestone }) {
  const paths = usePaths();
  const path = paths.projectMilestonePath(milestone.id!);
  const title = milestone.title;

  return (
    <div className="mt-1">
      <MilestoneIcon milestone={milestone} className="inline-block" />

      <span className="font-semibold mx-1">
        <Link to={path}>{title}</Link>
      </span>

      <span className="text-sm font-medium inline-flex items-center">
        &middot; Due date on{" "}
        <span className="inline-block ml-1">
          <DateField date={parseContextualDate(milestone.timeframe?.contextualEndDate)} readonly hideCalendarIcon />
        </span>
      </span>
    </div>
  );
}

function getUpcommingMilestones(project: Projects.Project) {
  const milestones = project.milestones!.map((m) => m!);
  const pending = Milestones.filterPending(milestones);

  return Milestones.sortByDeadline(pending);
}
