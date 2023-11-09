import React from "react";

import classnames from "classnames";
import ContributorAvatar, {
  ChampionPlaceholder,
  ReviewerPlaceholder,
  ContributorAdd,
} from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";
import * as Contributors from "@/graphql/Projects/contributors";
import * as Icons from "@tabler/icons-react";

import { TextTooltip } from "@/components/Tooltip";
import Options from "./Options";

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

export function ContributorList({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="flex items-center">
      <Link to={contributorsPath} data-test-id="project-contributors">
        <div className="flex items-center justify-center gap-1 cursor-pointer">
          <Champion champion={champion} />
          <Reviewer reviewer={reviewer} />

          {contributors.map((c) => (
            <ContributorAvatar key={c.id} contributor={c} />
          ))}

          {project.permissions.canEditContributors && <ContributorAdd />}
        </div>
      </Link>
    </div>
  );
}

function Champion({ champion }) {
  if (!champion) return <ChampionPlaceholder />;

  return <ContributorAvatar contributor={champion} />;
}

function Reviewer({ reviewer }) {
  if (!reviewer) return <ReviewerPlaceholder />;

  return <ContributorAvatar contributor={reviewer} />;
}
