import React, { useState } from "react";

import Modal from "@/components/Modal";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { IconArrowUpRight } from "@tabler/icons-react";
import { splitByStatus } from "@/models/milestones";
import { Project, sortContributorsByRole } from "@/models/projects";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { MiniPieChart } from "@/components/MiniPieChart";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { DivLink } from "@/components/Link";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";
import { Paths } from "@/routes/paths";

import { ProjectNode } from "../tree";

export function ProjectDetails({ node }: { node: ProjectNode }) {
  return (
    <div className="pl-[20px] flex gap-10 items-center">
      <Status project={node.project} />
      <MilestoneCompletion project={node.project} />
      <NextMilestone project={node.project} />
      <SpaceName project={node.project} />
      <ContributorsList project={node.project} />
    </div>
  );
}

function Status({ project }: { project: Project }) {
  const [showCheckIn, setShowCheckIn] = useState(false);

  const toggleShowCheckIn = () => {
    setShowCheckIn((prev) => !prev);
  };

  if (!project.lastCheckIn) {
    return <StatusIndicator project={project} size="sm" textClassName="text-content-dimmed" />;
  }

  return (
    // The 14px padding-right in the container is the same
    // as the 14px offset in icon.
    <div className="pr-[14px]">
      <div onClick={toggleShowCheckIn} className="relative cursor-pointer">
        <StatusIndicator project={project} size="sm" textClassName="text-content-dimmed" />
        <IconArrowUpRight size={12} className="absolute top-0 right-[-14px]" />
      </div>

      <LatestProjectCheckIn project={project} showCheckIn={showCheckIn} toggleShowCheckIn={toggleShowCheckIn} />
    </div>
  );
}

interface LatestProjectCheckInProps {
  project: Project;
  showCheckIn: boolean;
  toggleShowCheckIn: () => void;
}

function LatestProjectCheckIn({ project, showCheckIn, toggleShowCheckIn }: LatestProjectCheckInProps) {
  assertPresent(project.lastCheckIn, "lastCheckIn must be present in project");

  return (
    <Modal title={project.name!} hideModal={toggleShowCheckIn} isOpen={showCheckIn}>
      <StatusSection checkIn={project.lastCheckIn} reviewer={project.reviewer || undefined} />
      <DescriptionSection checkIn={project.lastCheckIn} />
    </Modal>
  );
}

function MilestoneCompletion({ project }: { project: Project }) {
  assertPresent(project.milestones, "milestones must be present in project");

  let { pending, done } = splitByStatus(project.milestones);
  const totalCount = pending.length + done.length;

  if (totalCount === 0) return <></>;

  return (
    <div className="flex items-center gap-2 shrink-0 text-xs text-content-dimmed">
      <MiniPieChart completed={done.length} total={totalCount} />
      {done.length}/{totalCount} completed
    </div>
  );
}

function NextMilestone({ project }: { project: Project }) {
  if (!project.nextMilestone) return <></>;

  const name = truncateString(project.nextMilestone.title!, 40);

  return (
    <div className="flex items-center gap-2">
      <MilestoneIcon milestone={project.nextMilestone} />
      <div className="flex-1 truncate text-xs text-content-dimmed">
        <FormattedTime time={project.nextMilestone.deadlineAt!} format="short-date" />: {name}
      </div>
    </div>
  );
}

function SpaceName({ project }: { project: Project }) {
  assertPresent(project.space, "space must be present in project");

  const path = Paths.spacePath(project.space.id!);

  return (
    <DivLink to={path} className="text-xs text-content-dimmed">
      {project.space.name}
    </DivLink>
  );
}

function ContributorsList({ project }: { project: Project }) {
  assertPresent(project.contributors, "contributors must be present in project");

  const sortedContributors = sortContributorsByRole(project.contributors);
  const hiddenContribsCount = sortedContributors.length - 8;

  return (
    <div className="flex items-center gap-1">
      {sortedContributors.slice(0, 8).map((contributor) => (
        <Avatar key={contributor!.id} person={contributor!.person!} size="tiny" />
      ))}

      {hiddenContribsCount > 0 && (
        <div className="flex items-center justify-center text-[.6rem] w-5 h-5 bg-surface-dimmed text-content-dimmed font-bold rounded-full">
          +{hiddenContribsCount}
        </div>
      )}
    </div>
  );
}
