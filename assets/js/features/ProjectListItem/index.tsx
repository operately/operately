import * as React from "react";
import * as Milestones from "@/models/milestones";
import * as Projects from "@/models/projects";

import Avatar from "@/components/Avatar";
import classNames from "classnames";
import FormattedTime from "@/components/FormattedTime";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { MiniPieChart } from "@/components/MiniPieChart";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { PrivacyIndicator } from "@/features/projects/PrivacyIndicator";

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
  const path = Paths.projectPath(project.id);

  return (
    <div className="font-extrabold flex items-center gap-2">
      <Link to={path} underline="never">
        {project.name}
      </Link>

      <PrivacyIndicator project={project} size={16} />
    </div>
  );
}

function ProjectStatusLine({ project }: { project: Projects.Project }) {
  if (project.status === "closed") {
    return (
      <div className="mt-2 text-sm font-medium">
        {project.retrospective && (
          <>
            Closed on <FormattedTime time={project.closedAt!} format="short-date" /> &middot;{" "}
          </>
        )}
        <Link to={Paths.projectRetrospectivePath(project.id!)}>Read the retrospective</Link>
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
      <div className="flex-1 truncate">
        <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />: {project.nextMilestone.title}
      </div>
    </div>
  );
}

function ContribList({ project, size }) {
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="flex items-center gap-1 mb-3">
      {sortedContributors.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person!} size={size} />
      ))}
    </div>
  );
}
