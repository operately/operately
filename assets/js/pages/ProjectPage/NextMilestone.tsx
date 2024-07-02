import React from "react";

import * as Milestones from "@/models/milestones";
import * as Projects from "@/models/projects";

import { Link } from "@/components/Link";
import { DimmedLabel } from "./Label";
import FormattedTime from "@/components/FormattedTime";
import { GhostButton } from "@/components/Button";
import { createPath } from "@/utils/paths";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { Paths } from "@/routes/paths";

export function NextMilestone({ project }) {
  const milestones = project.milestones || [];

  if (milestones.length === 0) {
    return <MilestonesZeroState project={project} />;
  }

  const nextMilestones = getNextMilestones(project);

  if (nextMilestones.length === 0) {
    return <AllMilestonesCompleted project={project} />;
  }

  return <NextMilestoneList project={project} nextMilestones={nextMilestones} />;
}

function MilestonesZeroState({ project }) {
  const editPath = createPath("projects", project.id, "edit", "timeline");

  const editLink = (
    <GhostButton linkTo={editPath} testId="add-milestones-link" size="xs" type="secondary">
      Edit Timeline
    </GhostButton>
  );

  return (
    <div className="text-sm">
      No milestones defined yet.
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

function NextMilestoneList({
  project,
  nextMilestones,
}: {
  project: Projects.Project;
  nextMilestones: Projects.Milestone[];
}) {
  return (
    <div>
      <DimmedLabel>Upcoming Milestones</DimmedLabel>

      {nextMilestones.map((milestone) => (
        <MilestoneLink key={milestone.id} project={project} milestone={milestone} />
      ))}
    </div>
  );
}

function MilestoneLink({ project, milestone }) {
  const path = Paths.projectMilestonePath(project.id!, milestone.id!);
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

function getNextMilestones(project: Projects.Project) {
  const milestones = project.milestones!.map((m) => m!);
  const pending = Milestones.filterPending(milestones);

  return Milestones.sortByDeadline(pending);
}
