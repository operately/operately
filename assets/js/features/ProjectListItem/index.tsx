import React from "react";

import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { Link } from "@/components/Link";
import { MiniPieChart } from "@/components/MiniPieChart";
import { Indicator } from "@/components/ProjectHealthIndicators";
import { TextTooltip } from "@/components/Tooltip";
import { MilestoneIcon } from "@/components/MilestoneIcon";

import { createPath } from "@/utils/paths";
import classNames from "classnames";

interface ProjectListItemProps {
  project: Projects.Project;
  avatarPosition?: "bottom" | "right";
}

export function ProjectListItem({ project, avatarPosition = "bottom" }: ProjectListItemProps) {
  const className = classNames("flex", {
    "justify-between": avatarPosition === "right",
    "flex-col gap-4": avatarPosition === "bottom",
  });

  const avatarSize = avatarPosition === "right" ? 24 : 20;

  return (
    <div className="flex justify-between shadow-sm bg-surface h-full p-2 border border-stroke-base rounded">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <ProjectNameLine project={project} />
            <NextMilestone project={project} />
          </div>
        </div>

        <div className="flex items-center justify-between w-full mt-6">
          <ContribList project={project} size={avatarSize} />
        </div>
      </div>
    </div>
  );
}

// <Status project={project} />

function ProjectNameLine({ project }) {
  const path = createPath("projects", project.id);

  return (
    <div className="font-bold flex items-center gap-2 text-sm">
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
    return <div className="flex items-start gap-5 mt-2 text-sm"></div>;
  }
}

function MilestoneCompletion({ project }) {
  let { pending, done } = Milestones.splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;
  const width = totalCount === 0 ? 0 : (done.length / totalCount) * 100;

  return (
    <div className="w-full">
      <div className="bg-green-500/30 relative rounded h-1.5 w-full overflow-hidden">
        <div className="h-full bg-accent-1" style={{ width: `${width}%` }}></div>
      </div>

      <div className="flex justify-between mt-1 text-xs">
        {done.length}/{totalCount} milestones completed
      </div>
    </div>
  );
}

function Status({ project }) {
  return (
    <div className="flex gap-4 shrink-0 text-sm">
      {project.isOutdated ? (
        <Indicator value="outdated" type="status" size={14} />
      ) : (
        <Indicator value={project.health} type="status" size={14} />
      )}
      {!project.isOutdated && <HealthIssues checkIn={project.lastCheckIn} />}
    </div>
  );
}

function NextMilestone({ project }) {
  if (project.nextMilestone === null) {
    return <div className="flex items-center gap-1 text-sm text-content-dimmed">No milestones</div>;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
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
    <div className="flex items-center flex-1 gap-0.5">
      {sortedContributors.map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person} size={20} />
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
    <div className="flex items-center shrink-0 gap-4">
      {issues.map((issue, index) => (
        <div key={index}>
          <Indicator key={issue} value={checkIn.content.health[issue]} type={issue} size={14} />
        </div>
      ))}
    </div>
  );
}
