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
    <div
      className={classnames("text-center", "font-bold max-w-3xl mx-auto", "break-all", projectNameTextSize(project))}
    >
      {project.name}
    </div>
  );
}

function projectNameTextSize(project: Project) {
  if (project.name.length > 40) {
    return "text-3xl";
  } else {
    return "text-4xl";
  }
}

function ContributorList({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="mt-4 flex items-center justify-center">
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
