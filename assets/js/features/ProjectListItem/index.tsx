import React from "react";

import * as Milestones from "@/models/milestones";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { Link } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import { TextTooltip } from "@/components/Tooltip";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";

import { createPath } from "@/utils/paths";
import classNames from "classnames";

interface ProjectListItemProps {
  project: Projects.Project;
  avatarPosition?: "bottom" | "right";
  showSpace?: boolean;
}

export function ProjectListItem({ project, avatarPosition = "bottom", showSpace = false }: ProjectListItemProps) {
  const className = classNames("flex", {
    "items-center justify-between": avatarPosition === "right",
    "flex-col gap-4": avatarPosition === "bottom",
  });

  const avatarSize = avatarPosition === "right" ? 24 : 20;

  return (
    <div className={className}>
      <div className="flex flex-col">
        {showSpace && <div className="text-xs text-content-dimmed font-medium">{project.space!.name!}</div>}
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
  if (project.status === "closed") {
    return (
      <div className="mt-2 text-sm font-medium">
        Closed on <FormattedTime time={project.closedAt} format="short-date" /> &middot;{" "}
        <Link to={createPath("projects", project.id, "retrospective")}>Read the retrospective</Link>
      </div>
    );
  } else {
    return (
      <div className="flex items-start gap-5 mt-2 text-sm">
        <Status project={project} />
        <MilestoneCompletion project={project} />
        <NextMilestone project={project} />
      </div>
    );
  }
}

function MilestoneCompletion({ project }) {
  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <MiniPieChart completed={done.length} total={totalCount} size={16} />
      {done.length}/{totalCount} completed
    </div>
  );
}

function Status({ project }) {
  return (
    <div className="flex flex-col shrink-0">
      <StatusIndicator project={project} />
    </div>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="flex items-center gap-2">
      <MilestoneIcon milestone={project.nextMilestone} />
      <div className="flex-1 truncate pr-2 w-96">
        <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />: {project.nextMilestone.title}
      </div>
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
