import React from "react";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { Link } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import { Indicator } from "@/components/ProjectHealthIndicators";
import { TextTooltip } from "@/components/Tooltip";

import { createPath } from "@/utils/paths";
import classNames from "classnames";

interface ProjectListItemProps {
  project: Projects.Project;
  avatarPosition?: "bottom" | "right";
}

export function ProjectListItem({ project, avatarPosition = "bottom" }: ProjectListItemProps) {
  const className = classNames("flex", {
    "items-center justify-between": avatarPosition === "right",
    "flex-col gap-4": avatarPosition === "bottom",
  });

  const avatarSize = avatarPosition === "right" ? 24 : 20;

  return (
    <div className={className}>
      <div className="flex flex-col">
        <ProjectNameLine project={project} />
        <ProjectStatusLine project={project} />
      </div>
      <ContribList project={project} size={avatarSize} />
    </div>
  );
}

function ProjectNameLine({ project }) {
  const path = createPath("projects", project.id);

  return (
    <div className="font-extrabold flex items-center gap-2">
      <Link to={path} underline={false}>
        {project.name}
      </Link>

      <PrivateIndicator project={project} />
    </div>
  );
}

function ProjectStatusLine({ project }) {
  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  const completion = (
    <div className="flex items-center gap-2">
      <MiniPieChart completed={done.length} total={totalCount} size={16} />
      {done.length}/{totalCount} completed
    </div>
  );

  if (project.status === "closed") {
    return (
      <div className="mt-2 text-sm font-medium">
        Closed on <FormattedTime time={project.closedAt} format="short-date" /> &middot;{" "}
        <Link to={createPath("projects", project.id, "retrospective")}>Read the retrospective</Link>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-5 mt-2 text-sm">
        <Status project={project} />
        {totalCount > 0 && completion}
        <NextMilestone project={project} />
      </div>
    );
  }
}

function Status({ project }) {
  return <Indicator value={project.health} type="status" />;
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <Icons.IconFlag3Filled size={16} />
      <span className="">{project.nextMilestone.title}</span>
    </div>
  );
}

function ContribList({ project, size }) {
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="flex items-center gap-1">
      {sortedContributors.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size={size} />
      ))}
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
