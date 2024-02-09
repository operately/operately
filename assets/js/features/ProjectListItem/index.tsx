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

interface ProjectListItemProps {
  project: Projects.Project;
  avatarPosition?: "bottom" | "right";
}

export function ProjectListItem({ project, avatarPosition = "bottom" }: ProjectListItemProps) {
  const avatarSize = 20;
  const className = "flex items-center justify-between";

  return (
    <div className={className}>
      <div className="flex flex-col w-64 flex-1">
        <ProjectNameLine project={project} />
        <NextMilestone project={project} />
      </div>

      <div className="w-30 flex items-start mr-8 justify-between">
        <div className="w-30 flex gap-1 font-medium">
          <div className="w-6 h-6 bg-accent-1 rounded-full flex items-center justify-center">
            <Icons.IconCurrencyDollar size={14} className="text-white-1" />
          </div>

          <div className="w-6 h-6 bg-accent-1 rounded-full flex items-center justify-center">
            <Icons.IconUsers size={14} className="text-white-1" />
          </div>

          <div className="w-6 h-6 bg-accent-1 rounded-full flex items-center justify-center">
            <Icons.IconHourglassHigh size={14} className="text-white-1" />
          </div>

          <div className="w-6 h-6 bg-accent-1 rounded-full flex items-center justify-center">
            <Icons.IconAsteriskSimple size={14} className="text-white-1" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 w-6 justify-center shrink-0">
        <Avatar person={project.contributors[0].person} size={20} />
      </div>

      <div className="flex items-start gap-2 w-6 justify-center shrink-0">
        <Avatar person={project.contributors[0].person} size={20} />
      </div>
    </div>
  );
}

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

  const width = totalCount === 0 ? 0 : (done.length / totalCount) * 100;

  return (
    <div className="h-2 bg-surface-dimmed flex items-center gap-1 px-2 relative border border-accent-1 w-24 overflow-hidden">
      <div className="absolute inset-0 bg-accent-1 " style={{ width: `${width}%` }} />
    </div>
  );
}

function Status({ project }) {
  return (
    <div className="flex flex-col shrink-0 text-sm">
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
  if (!project.nextMilestone) {
    return <div className="flex items-center gap-1 text-sm">This project has no milestones</div>;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <MilestoneIcon milestone={project.nextMilestone} iconSize={14} />
      <div className="flex-1 truncate pr-2">
        <FormattedTime time={project.nextMilestone.deadlineAt} format="short-date" />: {project.nextMilestone.title}
      </div>
    </div>
  );
}

function AvatarList({ contributors, size }) {
  const otherContributors = contributors
    .filter((contrib) => contrib.role !== "champion")
    .filter((contrib) => contrib.role !== "reviewer");

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {otherContributors.map((contrib, index: number) => (
        <div
          className="rounded-full transition-all cursor-default border-surface"
          key={contrib.id}
          style={{ zIndex: contributors.length - index }}
        >
          <Avatar person={contrib.person} size={size} />
        </div>
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
    <div className="flex flex-col shrink-0 text-sm">
      {issues.map((issue, index) => (
        <div key={index}>
          <Indicator key={issue} value={checkIn.content.health[issue]} type={issue} />
        </div>
      ))}
    </div>
  );
}
