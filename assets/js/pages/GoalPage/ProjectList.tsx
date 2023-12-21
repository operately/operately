import React from "react";
import * as Goals from "@/models/goals";

import Avatar from "@/components/Avatar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { Indicator } from "@/components/ProjectHealthIndicators";
import { TextTooltip } from "@/components/Tooltip";
import classnames from "classnames";
import { createPath } from "@/utils/paths";
import { Link } from "@/components/Link";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

export function ProjectList({ goal }: { goal: Goals.Goal }) {
  return (
    <>
      {goal.projects!.map((project) => (
        <ProjectListItem key={project!.id} project={project} />
      ))}
    </>
  );
}

function ProjectListItem({ project }) {
  const path = createPath("projects", project.id);
  const className = classnames("py-5", "bg-surface", "flex flex-col", "border-t last:border-b border-stroke-base");

  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  const completion = (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done.length} total={totalCount} size={16} />
      {done.length}/{totalCount} completed
    </div>
  );

  const name = (
    <div className="font-extrabold flex items-center gap-2">
      <Link to={path} underline={false}>
        {project.name}
      </Link>

      <PrivateIndicator project={project} />
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <div className="">
            {name}

            <div className="flex items-center gap-5 mt-2 text-sm">
              <Status project={project} />
              {totalCount > 0 && completion}
              <NextMilestone project={project} pending={pending} done={done} />
            </div>
          </div>
        </div>

        <ContribList project={project} />
      </div>
    </div>
  );
}

function PrivateIndicator({ project }) {
  if (!project.private) return null;

  return (
    <TextTooltip text="Private project. Visible only to contributors.">
      <div data-test-id="private-project-indicator">
        <Icons.IconLock size={16} />
      </div>
    </TextTooltip>
  );
}

function Status({ project }) {
  return <Indicator value={project.health} type="status" />;
}

function NextMilestone({ project, pending, done }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <Icons.IconFlagFilled size={16} className="text-green-600" />
      <span className="">{project.nextMilestone.title}</span>
    </div>
  );
}

function ContribList({ project }) {
  return (
    <div className="flex items-center gap-1">
      {project.contributors!.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size={24} />
      ))}
    </div>
  );
}
