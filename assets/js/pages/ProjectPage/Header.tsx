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

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div className="pb-8 relative">
      <ProjectName project={project} />
      <ContributorList project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div className={classnames("flex gap-2 items-center", "font-bold", "break-all", projectNameTextSize(project))}>
      {project.name}

      <PrivateIndicator project={project} />
    </div>
  );
}

function PrivateIndicator({ project }) {
  if (!project.private) return null;

  return (
    <TextTooltip text="Private project. Visible only to contributors.">
      <div className="mt-1">
        <Icons.IconLock size={20} />
      </div>
    </TextTooltip>
  );
}

function projectNameTextSize(project: Project) {
  if (project.name.length > 40) {
    return "text-3xl";
  } else {
    return "text-3xl";
  }
}

function ContributorList({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="mt-4 flex items-center">
      <Link to={contributorsPath}>
        <div className="flex items-center justify-center gap-1.5 cursor-pointer">
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
