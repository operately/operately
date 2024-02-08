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
import { MilestoneIcon } from "@/components/MilestoneIcon";

import { createPath } from "@/utils/paths";
import classNames from "classnames";
import ContributorAvatar from "@/components/ContributorAvatar";

interface ProjectListItemProps {
  project: Projects.Project;
  avatarPosition?: "bottom" | "right";
}

export function ProjectListItem({ project, avatarPosition = "bottom" }: ProjectListItemProps) {
  const avatarSize = 20;
  const className = "flex items-center justify-between gap-4";

  return (
    <div className={className}>
      <div className="flex flex-col flex-1">
        <ProjectNameLine project={project} />
        <NextMilestone project={project} />
      </div>

      <div className="flex items-start gap-2">
        <Avatar person={project.contributors[0].person} size={20} />
      </div>

      <div className="flex items-start gap-2">
        <Avatar person={project.contributors[0].person} size={20} />
      </div>

      <div className="flex items-start gap-2 w-24">
        <AvatarList contributors={project.contributors} size={20} />
      </div>
    </div>
  );
}

// <ProjectStatusLine project={project} />
// <ContribList project={project} size={avatarSize} />

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
      {project.isOutdated ? (
        <Indicator value="outdated" type="status" />
      ) : (
        <Indicator value={project.health} type="status" />
      )}
      {!project.isOutdated && <HealthIssues checkIn={project.lastCheckIn} />}
    </div>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <MilestoneIcon milestone={project.nextMilestone} iconSize={14} />
      <div className="flex-1 truncate pr-2">
        <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />: {project.nextMilestone.title}
      </div>
    </div>
  );
}

function ContribList({ project, size }) {
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return <AvatarList contributors={sortedContributors} size={size} />;
}

function AvatarList({ contributors, size }) {
  const condensed = contributors.length > 0;
  const condensedClass = condensed ? "-space-x-2 hover:space-x-0" : "";

  return (
    <div className="flex items-center gap-1">
      <div className={classNames("flex items-center", condensedClass)}>
        {contributors.map((contrib, index: number) => (
          <div
            className={classNames("border-2 rounded-full transition-all cursor-default", {
              "border-white-1": true,
            })}
            key={contrib.id}
            style={{ zIndex: contributors.length - index }}
          >
            <Avatar person={contrib.person} size={size} />
          </div>
        ))}
      </div>
      <div className="border-2 border-white-1 rounded-full transition-all cursor-default z-50">
        <Avatar person={contributors[0].person} size={size} />
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

function HealthIssues({ checkIn }) {
  if (!checkIn) return null;

  const issues = Object.keys(checkIn.content.health).filter((type) => {
    if (type === "status") {
      return false;
    }

    if (type === "schedule") {
      return checkIn.content.health[type] !== "on_schedule";
    }

    if (type === "budget") {
      return checkIn.content.health[type] !== "within_budget";
    }

    if (type === "team") {
      return checkIn.content.health[type] !== "staffed";
    }

    if (type === "risks") {
      return checkIn.content.health[type] !== "no_known_risks";
    }

    return false;
  });

  if (issues.length === 0) return null;

  return (
    <div className="flex flex-col shrink-0">
      {issues.map((issue, index) => (
        <div key={index}>
          <Indicator key={issue} value={checkIn.content.health[issue]} type={issue} />
        </div>
      ))}
    </div>
  );
}
