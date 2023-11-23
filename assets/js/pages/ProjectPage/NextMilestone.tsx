import React from "react";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Projects from "@/graphql/Projects";

import { Link } from "@/components/Link";
import { DimmedLabel } from "./Label";
import * as Icons from "@tabler/icons-react";
import FormattedTime from "@/components/FormattedTime";

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
  const editLink = (
    <Link to={`/projects/${project.id}/edit/timeline`} testId="add-milestoes-link">
      Add milestones
    </Link>
  );

  return (
    <div className="text-sm">
      No milestones defined yet.
      {project.permissions.canEditMilestone && <div className="mt-1 font-bold">{editLink}</div>}
    </div>
  );
}

function AllMilestonesCompleted({ project }) {
  const editLink = (
    <Link to={`/projects/${project.id}/edit/timeline`} testId="add-milestones-link">
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

function NextMilestoneList({ project, nextMilestones }) {
  return (
    <div>
      <DimmedLabel>Upcomming Milestones</DimmedLabel>

      {nextMilestones.map((milestone) => (
        <MilestoneLink key={milestone.id} project={project} milestone={milestone} />
      ))}
    </div>
  );
}

function MilestoneLink({ project, milestone }) {
  const path = `/projects/${project.id}/milestones/${milestone.id}`;
  const title = milestone.title;
  const deadline = milestone.deadlineAt;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Icons.IconFlagFilled size={16} className="text-yellow-400" />
      <div className="font-semibold">
        <Link to={path}>{title}</Link>
      </div>

      <div className="text-sm font-medium">
        &middot; Due date on <FormattedTime time={deadline} format="short-date" />
      </div>
    </div>
  );
}

function getNextMilestones(project: Projects.Project) {
  const pending = Milestones.filterPending(project.milestones!);

  return Milestones.sortByDeadline(pending);
}
