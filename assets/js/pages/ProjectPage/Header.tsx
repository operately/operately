import React from "react";

import classnames from "classnames";
import ContributorAvatar, {
  ChampionPlaceholder,
  ReviewerPlaceholder,
  ContributorAdd,
} from "@/components/ContributorAvatar";

import { Link } from "react-router-dom";
import {
  Project,
  isReviwerAssigned,
  isChampionAssigned,
} from "@/graphql/Projects";

interface HeaderProps {
  project: Project;
}

export default function Header({ project }: HeaderProps): JSX.Element {
  return (
    <div className="pt-12 pb-8 relative">
      <ProjectName project={project} />
      <Contributors project={project} />
    </div>
  );
}

function ProjectName({ project }) {
  return (
    <div
      className={classnames(
        "text-center",
        "font-bold max-w-3xl mx-auto",
        "break-all",
        projectNameTextSize(project)
      )}
    >
      {project.name}
    </div>
  );
}

function projectNameTextSize(project: Project) {
  if (project.name.length > 40) {
    return "text-3xl";
  }
  if (project.name.length > 30) {
    return "text-4xl";
  }
  return "text-5xl";
}

function Contributors({ project }) {
  const contributorsPath = `/projects/${project.id}/contributors`;

  return (
    <div className="mt-4 flex items-center justify-center">
      <Link to={contributorsPath}>
        <div className="flex items-center justify-center gap-1.5 cursor-pointer">
          <ContributorList project={project} />
          <ContributorAdd />
        </div>
      </Link>
    </div>
  );
}

function ContributorList({ project }: { project: Project }) {
  return (
    <>
      {!isChampionAssigned(project) && <ChampionPlaceholder />}
      {!isReviwerAssigned(project) && <ReviewerPlaceholder />}

      {project.contributors.map((c) => (
        <ContributorAvatar key={c.id} contributor={c} />
      ))}
    </>
  );
}
