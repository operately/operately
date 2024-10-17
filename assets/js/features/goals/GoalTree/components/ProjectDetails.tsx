import React, { useState } from "react";

import Modal from "@/components/Modal";
import { assertPresent } from "@/utils/assertions";
import { IconArrowUpRight } from "@tabler/icons-react";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { Project } from "@/models/projects";
import { StatusSection } from "@/features/projectCheckIns/StatusSection";
import { DescriptionSection } from "@/features/projectCheckIns/DescriptionSection";

import { ProjectNode } from "../tree";

export default function ProjectDetails({ node }: { node: ProjectNode }) {
  return (
    <div className="pl-[20px] flex">
      <Status project={node.project} />
    </div>
  );
}

function Status({ project }: { project: Project }) {
  const [showCheckIn, setShowCheckIn] = useState(false);

  const toggleShowCheckIn = () => {
    setShowCheckIn((prev) => !prev);
  };

  return (
    <div>
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
