import React from "react";

import classnames from "classnames";
import ContributorAvatar from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { Project } from "@/models/projects";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { TextTooltip } from "@/components/Tooltip";
import Options from "./Options";
import { GhostButton } from "@/components/Button";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div>
      <ProjectName project={project} />
      <div className="mt-2"></div>
      <ContributorList project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className="">
      <div className="flex items-center justify-center">
        <div className="bg-green-100 text-green-700 text-white-1 font-semibold rounded-b-xl px-6 py-1 flex flex-col items-center">
          On Track
        </div>
      </div>

      <div
        className={classnames("font-bold flex-1", "break-all", "text-3xl", "text-content-accent", "text-center mt-6")}
      >
        {project.name}
        <PrivateIndicator project={project} />
      </div>

      <div className="text-center mt-1 text-sm mb-4">
        Next Milestone: Tasks can be attached to projects and milestones
      </div>

      <div className="flex gap-4 items-center">
        <Options project={project} />
      </div>
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
    <div className="flex items-center justify-center">
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
