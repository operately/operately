import * as Projects from "@/models/projects";
import * as React from "react";
import * as Milestones from "@/models/milestones";
import * as Time from "@/utils/time";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { DimmedLabel } from "./Label";
import { GhostButton } from "@/components/Button";
import { MilestoneIcon } from "@/components/MilestoneIcon";

import Duration from "@/components/Duration";
import FormattedTime from "@/components/FormattedTime";

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
  return (
    <Link to={Paths.projectMilestonesPath(project.id!)} testId="manage-timeline">
      View
    </Link>
  );
}

function Content({ project }) {
  return (
    <div>
      <div className="flex items-start gap-12 text-sm mb-6">
        <StartDate project={project} />
        <EndDate project={project} />
        <DurationField project={project} />
        <Progress project={project} />
      </div>

      <ProjectMilestones project={project} />
    </div>
  );
}

function StartDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Start Date</DimmedLabel>
      <div className="font-semibold">
        <FormattedTime time={project.startedAt!} format="short-date" />
      </div>
    </div>
  );
}

function EndDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Due Date</DimmedLabel>
      {project.deadline ? (
        <div className="font-semibold">
          <FormattedTime time={project.deadline} format="short-date" />
        </div>
      ) : (
        <div>
          <span className="text-content-dimmed">No due date</span>
        </div>
      )}
    </div>
  );
}

function DurationField({ project }: { project: Projects.Project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Duration</DimmedLabel>
      <div className="font-semibold">
        <Duration start={start} end={end} />
      </div>
    </div>
  );
}

function Progress({ project }: { project: Projects.Project }) {
  if (project.status === "closed") return null;
  if (project.isArchived) return null;

  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Progress</DimmedLabel>
      <div className="flex items-center gap-2 ">
        {Time.isPast(start) ? (
          <span className="font-semibold">
            {Time.weeksBetween(start, new Date())} / {Time.weeksBetween(start, end)} weeks
          </span>
        ) : (
          <>Not yet started</>
        )}
      </div>
    </div>
  );
}

export function ProjectMilestones({ project }) {
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

function MilestonesZeroState({ project }) {
  const editPath = Paths.projectEditTimelinePath(project.id!);

  const editLink = (
    <GhostButton linkTo={editPath} testId="add-milestones-link" size="xs" type="secondary">
      Edit Timeline
    </GhostButton>
  );

  return (
    <div className="text-sm">
      Outline your project timeline with milestones.
      {project.permissions.canEditMilestone && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function AllMilestonesCompleted({ project }) {
  const editLink = (
    <Link to={Paths.projectEditTimelinePath(project.id!)} testId="add-milestones-link">
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

function MilestoneLink({ milestone }) {
  const path = Paths.projectMilestonePath(milestone.id!);
  const title = milestone.title;
  const deadline = milestone.deadlineAt;

  return (
    <div className="mt-1">
      <MilestoneIcon milestone={milestone} className="inline-block" />

      <span className="font-semibold mx-1">
        <Link to={path}>{title}</Link>
      </span>

      <span className="text-sm font-medium">
        &middot; Due date on <FormattedTime time={deadline} format="short-date" />
      </span>
    </div>
  );
}

function getUpcommingMilestones(project: Projects.Project) {
  const milestones = project.milestones!.map((m) => m!);
  const pending = Milestones.filterPending(milestones);

  return Milestones.sortByDeadline(pending);
}
