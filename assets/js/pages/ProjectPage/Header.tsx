import * as React from "react";
import * as Icons from "@tabler/icons-react";

import classnames from "classnames";

import { DivLink } from "@/components/Link";
import { Project } from "@/models/projects";

import { TextTooltip } from "@/components/Tooltip";
import { Paths } from "@/routes/paths";

import Options from "./Options";
import Avatar from "@/components/Avatar";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div>
      <ProjectName project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <ParentGoal project={project} />

        <div className={classnames("flex gap-3 items-center", "text-content-accent", "max-w-[90%]")}>
          <div className="bg-indigo-500/10 p-1.5 rounded-lg">
            <Icons.IconHexagons size={24} className="text-indigo-500" />
          </div>

          <div className="inline-flex items-center gap-2 flex-1">
            <div className="font-bold text-2xl text-content-accent">{project.name}</div>
            <ContributorList project={project} />
          </div>
          <PrivateIndicator project={project} />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Options project={project} />
      </div>
    </div>
  );
}

function ContributorList({ project }) {
  return (
    <div className="flex items-center -space-x-2">
      {project.contributors.map((contributor, index) => (
        <div
          key={contributor.id}
          className="relative border-surface border-2 rounded-full"
          style={{ zIndex: 100 - index }}
        >
          <div className="rounded-full border border-stroke-base">
            <Avatar person={contributor.person} size={24} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ParentGoal({ project }) {
  if (!project.goal) return null;

  return (
    <div className="flex items-center">
      <div className="border-t-2 border-l-2 border-stroke-base rounded-tl w-7 h-2.5 ml-4 mb-1 mt-2.5 mr-1" />
      <Icons.IconTarget size={14} className="text-red-500" />
      <DivLink
        to={Paths.goalPath(project.goal.id)}
        className="text-sm text-content-dimmed mx-1 hover:underline font-medium"
      >
        {project.goal.name}
      </DivLink>
    </div>
  );
}

function PrivateIndicator({ project }) {
  if (!project.private) return null;

  return (
    <TextTooltip text="Private project. Visible only to contributors.">
      <div className="mt-1" data-test-id="private-project-indicator">
        <Icons.IconLock size={20} />
      </div>
    </TextTooltip>
  );
}
