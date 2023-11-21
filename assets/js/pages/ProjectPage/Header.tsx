import React from "react";

import classnames from "classnames";
import ContributorAvatar from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";

import { TextTooltip } from "@/components/Tooltip";
import Options from "./Options";
import { GhostButton } from "@/components/Button";

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
    <div className="flex items-center justify-between">
      <div
        className={classnames("flex gap-2 items-center", "font-bold", "break-all", "text-3xl", "text-content-accent")}
      >
        {project.name}

        <PrivateIndicator project={project} />
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
  const contributors = (project.contributors || []).filter((c) => c !== null);

  return (
    <div className="flex items-center">
      <Link to={contributorsPath} data-test-id="project-contributors">
        <div className="flex items-center justify-center gap-1 cursor-pointer">
          {contributors.map((c) => c && <ContributorAvatar key={c.id} contributor={c} />)}

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
