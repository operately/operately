import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import classnames from "classnames";
import ContributorAvatar from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { DivLink } from "@/components/Link";
import { Project } from "@/models/projects";

import { TextTooltip } from "@/components/Tooltip";
import { GhostButton } from "@/components/Button";
import { Paths } from "@/routes/paths";

import Options from "./Options";

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
      <div>
        <ParentGoal project={project} />

        <div className={classnames("flex gap-3 items-start", "text-content-accent", "max-w-[90%]")}>
          <div className="bg-indigo-500/10 p-1.5 rounded-full">
            <Icons.IconHexagons size={24} className="text-indigo-500" />
          </div>

          <div className="font-bold text-3xl text-content-accent">{project.name}</div>
          <PrivateIndicator project={project} />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Options project={project} />
      </div>
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
        className="text-xs text-content-dimmed mx-1 hover:underline font-medium"
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

function ContributorList({ project }: { project: Projects.Project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="flex items-center">
      <Link to={contributorsPath} data-test-id="project-contributors">
        <div className="flex items-center justify-center gap-1 cursor-pointer">
          {sortedContributors.map((c) => c && <ContributorAvatar key={c.id} contributor={c} />)}

          {project.permissions.canEditContributors && (
            <div className="ml-2">
              <GhostButton size="xs" type="secondary" testId="manage-team-button">
                Manage Team
              </GhostButton>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
