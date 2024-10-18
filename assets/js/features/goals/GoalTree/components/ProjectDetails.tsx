import React, { useState } from "react";

import Modal from "@/components/Modal";
import { IconArrowUpRight } from "@tabler/icons-react";
import { splitByStatus } from "@/models/milestones";
import { Project } from "@/models/projects";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";
import { MiniPieChart } from "@/components/MiniPieChart";
import { assertPresent } from "@/utils/assertions";

import { ProjectNode } from "../tree";

export default function ProjectDetails({ node }: { node: ProjectNode }) {
  return (
    <div className="pl-[20px] flex gap-8 items-center">
      <Status project={node.project} />
      <MilestoneCompletion project={node.project} />
    </div>
  );
}

function Status({ project }: { project: Project }) {
  const [showCheckIn, setShowCheckIn] = useState(false);

  const toggleShowCheckIn = () => {
    setShowCheckIn((prev) => !prev);
  };

  return (
    // The 14px padding-right in the container is the same
    // as the 14px offset in icon.
    <div className="pr-[14px]">
      <div onClick={toggleShowCheckIn} className="relative cursor-pointer">
        <StatusIndicator project={project} size="sm" />
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
  assertPresent(project.reviewer, "reviewer must be present in project");

  return (
    <Modal title="" hideModal={toggleShowCheckIn} isOpen={showCheckIn} minHeight="300px">
      <div className="text-xl font-bold">{project.name}</div>

      <StatusSection checkIn={project.lastCheckIn} reviewer={project.reviewer} />
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
    <div className="flex items-center gap-2 shrink-0">
      <MiniPieChart completed={done.length} total={totalCount} />
      {done.length}/{totalCount} completed
    </div>
  );
}
