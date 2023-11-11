import React from "react";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Projects from "@/graphql/Projects";

import { Link } from "@/components/Link";
import { DimmedLabel } from "./Label";
import * as Icons from "@tabler/icons-react";
import FormattedTime from "@/components/FormattedTime";

export function NextMilestone({ project }) {
  const nextMilestones = getNextMilestones(project, 3);

  return (
    <div>
      <DimmedLabel>Next Milestones</DimmedLabel>

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

function getNextMilestones(project: Projects.Project, n: number) {
  const pending = Milestones.filterPending(project.milestones);
  const milestones = Milestones.sortByDeadline(pending);

  return milestones.slice(0, n);
}
